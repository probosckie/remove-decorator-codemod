const fs = require('fs');
const testFileData = require('./files_with_connect.js');

let filePath = 'src/js/Component/index.js';
let falseFile = 'src/js/Component2/index.js';

//blacklist will be manually modified
let blackList = [
  
];


//files where we have names export - need a variation
let edNotFound = [
  
];

function getLines(filePath) {
  let fileText = fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' });
  let fileLines = fileText.split('\n');
  return fileLines;
}

let testData = testFileData.fileArray;

function detectStartOfClass(line = '') {
  return line.includes('export default') || line.includes('extends');
}

function findExportDefaultLine(lines) {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('export default')) {
      return lines[i];
    }
  }
  return 'not-found';
}

function findLineInLinesContainingText(lines, searchString) {
  return lines.find(line => line.includes(searchString));
}

function findAllLinesAfterExportDefault(lines) {
  let endIndex, i, startIndex;
  for (i = 0; i < lines.length; i++) {
    if (lines[i].includes('export default')) {
      startIndex = i;
      break;
    }
  }

  endIndex = i + 6 > lines.length ? lines.length : i + 6;
  startIndex = startIndex - 5 < 0 ? startIndex : startIndex - 5;
  return lines.slice(startIndex, endIndex);
}

function findLinesContainingConnnect(lines) {
  let endIndex, startIndex;

  let connectStart = false;

  for (i = 0; i <= lines.length; i++) {
    let line = lines[i];

    if (line && line.includes('@connect')) {
      connectStart = true;
      startIndex = i;
    }

    if (connectStart && detectStartOfClass(line)) {
      endIndex = i;
      break;
    }
  }

  startIndex = startIndex - 5 < 0 ? startIndex - 5 : startIndex;
  endIndex = endIndex + 5 < lines.length ? endIndex + 5 : endIndex;
  return lines.slice(startIndex, endIndex);
}

function extractConnectFunction(filePath) {
  let i,
    lines = getLines(filePath);
  let className = '';
  let connectFnBody = '',
    connectStart = false;

  for (i = 0; i <= lines.length; i++) {
    let line = lines[i];

    if (line && line.includes('@connect')) {
      connectStart = true;
    }

    if (connectStart && detectStartOfClass(line)) {
      break;
    }

    if (connectStart) {
      connectFnBody = connectFnBody + line;
    }
  }
  //find named exports or differnt than default exports
  /* if (!lines[i].includes('export default')) {
     if (findExportDefaultLine(lines) === 'not-found') {
      console.log(filePath);
    } 
  } */

  className = lines[i];

  return { connectFnBody, className };
}

function lastChar(s) {
  return s[s.length - 1];
}

function removeEndComma(str) {
  let x = str.trim();
  if (lastChar(x) === ',') {
    return x.substring(0, x.length - 1);
  }
  return x;
}

function transformMapStateToProps(ms) {
  ms = ms.trim();
  return `const mapStateToProps = ${ms}`;
}

function transformMapDispatchToProps(md) {
  let s2 = md.substring(1, md.length - 1);
  let s3 = removeEndComma(s2);
  let terms = s3.split(',');
  if (!terms.length) return;
  let t2 = [];
  terms.forEach((term, index) => {
    if (term.includes(':')) {
      let splitTerm = term.split(':');
      t2.push(`${splitTerm[0]}: bindActionCreators(${splitTerm[1]},dispatch)`);
    } else {
      let t3 = term.trim();
      t2.push(`${t3}: bindActionCreators(${t3},dispatch)`);
    }
  });

  let final = `const mapDispatchToProps = dispatch => ({ ${t2.join(',')} })`;
  return final;
}

//get mapStateToProps and mapDispatchToProps from connect body
function extractMapFunctionsFromConnect(cf, file, className) {
  if (blackList.includes(file) || edNotFound.includes(file)) return;

  let mapDispatchToProps = '',
    mapStateToProps = '';
  cf = cf.trim();
  let lastIndex = cf.length - 1;

  cf = cf.substring(9, lastIndex);
  lastIndex = cf.length - 1;
  if (cf[lastIndex] === ',') {
    cf = cf.substr(0, lastIndex);
  }

  cf = cf.trim();

  console.log(file);

  let index = cf.length - 1;

  if (lastChar(cf) === 'l' || lastChar(cf) === '}') {
    if (lastChar(cf) === 'l') {
      mapDispatchToProps = 'null';
      index = index - 4;
      mapStateToProps = removeEndComma(cf.substring(0, index));
      console.log(className);
      console.log(transformMapStateToProps(mapStateToProps));
      console.log('export default compose(connect(mapStateToProps))()');
      //console.log(mapDispatchToProps);
      console.log('-------------------------');
    } else {
      let i,
        bracketCount = 0;

      for (i = index; i >= 0; i--) {
        if (cf[i] === '}') {
          bracketCount++;
        }
        if (cf[i] === '{') {
          bracketCount--;
        }
        if (bracketCount === 0) {
          break;
        }
      }
      mapDispatchToProps = cf.substring(i, index + 1);
      mapStateToProps = cf.substring(0, i);
      console.log(className);
      console.log(transformMapStateToProps(removeEndComma(mapStateToProps)));
      console.log(transformMapDispatchToProps(mapDispatchToProps));
      console.log(
        'export default compose(connect(mapStateToProps, mapDispatchToProps))()',
      );
      console.log('-------------------------');
    }
  } else {
    mapDispatchToProps = 'null';
    mapStateToProps = cf;
    console.log(className);
    console.log(transformMapStateToProps(mapStateToProps));
    //console.log(mapDispatchToProps);
    console.log('export default compose(connect(mapStateToProps))()');
    console.log('-------------------------');
  }
}

function extractFunctionsFromConnect(cf) {
  let mapDispatchToProps = '',
    mapStateToProps = '';
  cf = cf.trim();
  cf = cf.substring(9, cf.length - 1);
  cf = removeEndComma(cf);
  let index = cf.length - 1;

  if (lastChar(cf) === 'l' || lastChar(cf) === '}') {
    if (lastChar(cf) === 'l') {
      mapDispatchToProps = null;
      index = index - 4;
      mapStateToProps = removeEndComma(cf.substring(0, index));
    } else {
      let i,
        bracketCount = 0;

      for (i = index; i >= 0; i--) {
        if (cf[i] === '}') {
          bracketCount++;
        }
        if (cf[i] === '{') {
          bracketCount--;
        }
        if (bracketCount === 0) {
          break;
        }
      }
      mapDispatchToProps = cf.substring(i, index + 1);
      mapStateToProps = removeEndComma(cf.substring(0, i));
    }
  } else {
    mapDispatchToProps = null;
    mapStateToProps = cf;
  }

  return {
    mapStateToProps,
    mapDispatchToProps,
  };
}

//run for everyone non-blacklisted file
/* testData.forEach((file, index) => {
  let cf = extractConnectFunction(file);
  if (cf.connectFnBody)
    extractMapFunctionsFromConnect(cf.connectFnBody, file, cf.className);
}); */

//used to fine-tune the blacklist
function sameExportDefaultPresentInBoth(lines1, lines2) {
  let search1 = findLineInLinesContainingText(lines1, 'export default class');
  //console.log(search1);
  let search2 = findLineInLinesContainingText(lines2, 'export default class');
  //console.log(search2);
  if (search1 && search2 && search2 === search1) {
    console.log('good to go');
  }
  if (search1 !== search2) {
    console.log('different lines');
  }
  if (search1 === undefined) {
    console.log('line 1 undefined', '\n\n');
    console.log(lines1.join('\n'));
  }
  if (search2 === undefined) {
    console.log('line 2 undefined', '\n\n');
    console.log(lines2.join('\n'));
  }
}

function analyzeBlacklist() {
  blackList.forEach(file => {
    let lines = getLines(file);
    let edLines = findAllLinesAfterExportDefault(lines);
    let cnctLines = findLinesContainingConnnect(lines);

    console.log(file, '\n\n');
    sameExportDefaultPresentInBoth(edLines, cnctLines);
    /* console.log(edLines.join('\n'));
    console.log('\n\n\n');
    console.log(cnctLines.join('\n')); */
    console.log(
      '-----------------------------------------------------------------------',
    );
  });
}

function findClassName(classLine) {
  let splitLine = classLine.split(' ');
  let index = splitLine.findIndex(v => v === 'extends');
  return splitLine[index - 1];
}

//analyzeBlacklist();

//find other mixins apart from connect - TODO - make it work with 3 or more mixins, function also assumes that other mixins are declared only in 1 line - so make it work with multiple line mixins
function findOtherMixins(start, end, lines) {
  let mixin = [];

  if (lines[start - 1].includes('@')) {
    mixin.push(lines[start - 1]);
  }

  if (lines[end - 1].includes('@') && !lines[end - 1].includes('@connect')) {
    mixin.push(lines.slice(start, end - 1).join(''));
    mixin.push(lines[end - 1]);
  } else {
    mixin.push(lines.slice(start, end).join(''));
  }

  return mixin;
}

function addComposeToBlackList(file, isNonExportDefault) {
  let lines = getLines(file),
    className;
  let allMixins,
    endIndex,
    startIndex,
    i,
    connectStart = false;
  for (i = 0; i <= lines.length; i++) {
    let line = lines[i];

    if (line && line.includes('@connect')) {
      connectStart = true;
      startIndex = i;
    }

    if (connectStart && detectStartOfClass(line)) {
      endIndex = i;
      break;
    }
  }
  allMixins = findOtherMixins(startIndex, endIndex, lines);
  className = findClassName(lines[endIndex]);

  let extraDeclarationsAtEnd = '\n',
    temp,
    isMs,
    isMd;

  console.log(file, '\n\n');
  let mixinForCompose = [];
  allMixins.forEach(mixin => {
    if (mixin.includes('@connect')) {
      temp = extractFunctionsFromConnect(mixin);
      isMs = false;
      isMd = false;

      if (
        temp.mapStateToProps !== null &&
        temp.mapStateToProps !== 'null' &&
        temp.mapStateToProps !== '{}'
      ) {
        isMs = true;
        extraDeclarationsAtEnd += transformMapStateToProps(
          temp.mapStateToProps,
        );
        extraDeclarationsAtEnd += '\n';
      }
      if (
        temp.mapDispatchToProps !== null &&
        temp.mapDispatchToProps !== 'null' &&
        temp.mapDispatchToProps !== '{}'
      ) {
        isMd = true;
        extraDeclarationsAtEnd += transformMapDispatchToProps(
          temp.mapDispatchToProps,
        );
      }
      if (isMs && isMd) {
        mixinForCompose.push('connect(mapStateToProps, mapDispatchToProps)');
      }
      if (!isMs && isMd) {
        mixinForCompose.push('connect(null, mapDispatchToProps)');
      }
      if (isMs && !isMd) {
        mixinForCompose.push('connect(mapStateToProps)');
      }
    } else {
      mixinForCompose.push(mixin.substring(1));
    }
  });

  console.log(extraDeclarationsAtEnd, '\n');
  if (allMixins.length > 1) {
    console.log(
      `export default compose(${mixinForCompose
        .reverse()
        .join(',')})(${className}) \n`,
    );
  } else if (allMixins.length === 1) {
    if (!isNonExportDefault) {
      console.log(
        `export default compose(${mixinForCompose
          .reverse()
          .join(',')})(${className}) \n`,
      );
    } else {
      console.log(
        `const ${className} = ${mixinForCompose.join(
          '',
        )}(${className}Component)\n\n`,
      );
      console.log(`export {${className}}`);
    }
  }

  console.log(
    '---------------------------------------  ---------------------------------------',
  );
}

//handling multiple hoc
/* blackList.forEach((file, index) => {
  addComposeToBlackList(file);
}); */

edNotFound.forEach((file, index) => {
  addComposeToBlackList(file, true);
});
