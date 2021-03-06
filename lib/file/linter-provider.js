'use babel';

var esprima = require('esprima');
var unImportHelper = require('./unimport.js');

class LinterProvider {
  provideLinter() {
    var scopes = ['source.js', 'source.jsx','source.js.jsx','source.babel','source.js-semantic']

    var that = this;

    return {
    name: 'ESLint',
    grammarScopes: scopes,
    scope: 'file',
    lintOnFly: true,
    lint: function lint(textEditor) {

    var text = textEditor.getText();
    if (text.length === 0) {
      return Promise.resolve([]);
    }

    var filePath = textEditor.getPath();

    var unimportList = unImportHelper.parseToken(text);
    console.log('total unimportList', unimportList);

    if (unimportList && unimportList.length > 0) {
      var responses = [];
      for (var i = 0; i < unimportList.length; i++) {
        var result = unimportList[i];
        var line = result.line;
        var column = result.column;
        var endLine = result.endLine;
        var endColumn = result.endColumn;

        // line从1开始
        if (!line || typeof line === 'undefined') {
          line = 1;
        }

        // column从0开始
        if (!column || typeof column === 'undefined') {
          column = 0;
        }

        if (!endLine || typeof endLine === 'undefined') {
          endLine = 1;
        }

        if (!endColumn || typeof endColumn === 'undefined') {
          endColumn = 0;
        }

        var response = {
          fatal:true,
          line:line,
          column:column,
          endLine:endLine,
          endColumn:endColumn,
          message:'unimport class',
          severity:2,
          ruleId:'unimport'
        };

        responses.push(response);
      }

      return responses.map(function (_ref) {
          var message = _ref.message;
          var line = _ref.line;
          var severity = _ref.severity;
          var ruleId = _ref.ruleId;
          var column = _ref.column;
          var fix = _ref.fix;
          var endLine = _ref.endLine;
          var endColumn = _ref.endColumn;

          var textBuffer = textEditor.getBuffer();
          var linterFix = null;
          if (fix) {
            var fixRange = new _atom.Range(textBuffer.positionForCharacterIndex(fix.range[0]), textBuffer.positionForCharacterIndex(fix.range[1]));
            linterFix = {
              range: fixRange,
              newText: fix.text
            };
          }
          var range = void 0;
          var msgLine = line - 1;
          try {
            if (typeof endColumn !== 'undefined' && typeof endLine !== 'undefined') {
              // Here we always want the column to be a number
              range = [[msgLine, column], [endLine - 1, endColumn]];
            } else {
              // We want msgCol to remain undefined if it was initially so
              // `rangeFromLineNumber` will give us a range over the entire line
              range = [[msgLine,0],[msgLine,1]];
            }
          } catch (err) {
            throw new Error('Cannot mark location in editor for (' + ruleId + ') - (' + message + ')' + (' at line (' + line + ') column (' + column + ')'));
          }
          console.log('range', range);
          var ret = {
            filePath: filePath,
            type: severity === 1 ? 'Warning' : 'Error',
            range: range
          };

          var showRule = true;
          if (showRule) {
            var elName = ruleId ? 'a' : 'span';
            var href = ' href=' + '# ';
            ret.html = '<' + elName + href + ' class="badge badge-flexible eslint">' + (ruleId || 'Fatal') + '</' + elName + '> ' + message;
          } else {
            ret.text = message;
          }

          if (linterFix) {
            ret.fix = linterFix;
          }

          return ret;
        });
    } else {
      return Promise.resolve([]);
    }
  }
}
}
}

module.exports = new LinterProvider();
