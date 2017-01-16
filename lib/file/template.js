'use babel';
import fs from 'fs-plus';
import path from 'path';
import FileUtils from './file-utils.js';
import mkdirp from 'mkdirp';

var exec = require('child_process').execSync;

class Template {
  createAndroidProject(projectPath, packageName) {
    if (!FileUtils.isPathValid(projectPath)) {
      return;
    }

    if (!packageName || typeof packageName !== 'string' || packageName.length === 0) {
      return;
    }

    var rootPath = FileUtils.rootPath();
    if (!FileUtils.isPathValid(rootPath)) {
      return;
    }

    var templatePath = path.join(rootPath, 'lib/file/template/demo');
    if (!fs.existsSync(templatePath)) {
      var zipPath = path.join(rootPath, 'lib/file/template/template.zip');
      var unzipPath = path.join(rootPath, 'lib/file/template/demo');

      exec('unzip '+zipPath+' -d '+unzipPath);
    }

    if (fs.existsSync(templatePath)) {
      console.log('templatePath exist');
      // 创建android目录
      var projectName = path.basename(projectPath);
      var androidPath = path.join(projectPath, `android/${projectName}`);

      var packagePath = packageName.replace(/\./g, '/');
      console.log('packagePath', packagePath);
      packagePath = path.join(androidPath, 'demo/src/main/java/'+packagePath);

      console.log('androidPath',androidPath);

      if (fs.existsSync(androidPath)) {
        fs.removeSync(androidPath);
      }

      mkdirp.sync(androidPath);

      fs.copySync(templatePath, androidPath);

      var javaPath = path.join(androidPath, 'demo/src/main/java');
      // 在src/main/java下建包名文件夹
      if (!fs.existsSync(packagePath)) {
        mkdirp.sync(packagePath);
      }

      console.log('templage',javaPath,packagePath);
      fs.copyFileSync(javaPath+'/DemoMainActivity.java', packagePath+'/DemoMainActivity.java');
      fs.copyFileSync(javaPath+'/PluginEntryPoint.java', packagePath+'/PluginEntryPoint.java');

      fs.removeSync(javaPath+'/DemoMainActivity.java');
      fs.removeSync(javaPath+'/PluginEntryPoint.java');

      fs.moveSync(path.join(androidPath, 'demo'), path.join(androidPath, projectName));

      // 替换包名
      this.replacePackageName(androidPath, projectName, packageName);
    }
  }

  replacePackageName(rootPath, projectName, packageName) {
    if (!FileUtils.isPathValid(rootPath)) {
      return;
    }

    if (!packageName || typeof packageName !== 'string' || packageName.length === 0) {
      return;
    }

    if (!projectName || typeof projectName !== 'string' || projectName.length === 0) {
      return;
    }

    var subFiles = fs.listSync(rootPath);

    if (subFiles && subFiles.length > 0) {
      for (var i = 0; i < subFiles.length; i++) {
          var subFilePath = subFiles[i];

          if (path.basename(subFilePath).startsWith('.')) {
            continue;
          }

          if (fs.isDirectorySync(subFilePath)) {
            this.replacePackageName(subFilePath, projectName, packageName);
          } else if (fs.isFileSync(subFilePath)) {
            var content = fs.readFileSync(subFilePath).toString();

            if (content && content.length > 0) {
              console.log('subFilePath',subFilePath);

              content = content.replace(/\${package_name}\$/g, packageName);
              content = content.replace(/\${project_name}\$/g, projectName);

              fs.writeFileSync(subFilePath, content);
            }
          }
        }
      }
  }
}

module.exports = new Template();