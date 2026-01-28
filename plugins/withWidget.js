const {
  withPlugins,
  withXcodeProject,
  withEntitlementsPlist,
  withAndroidManifest,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const WIDGET_TARGET_NAME = 'CoupleStatusWidget';
const APP_GROUP_ID = 'group.com.yourapp.couplestatus';

// 위젯 템플릿 파일 복사
function copyWidgetTemplates(projectRoot) {
  const templateDir = path.join(projectRoot, 'widgets', 'ios');
  const targetDir = path.join(projectRoot, 'ios', WIDGET_TARGET_NAME);

  if (!fs.existsSync(templateDir)) {
    console.log(`[withWidget] 위젯 템플릿 폴더가 없습니다: ${templateDir}`);
    return false;
  }

  // 대상 폴더 생성
  fs.mkdirSync(targetDir, { recursive: true });

  // Swift 파일 복사
  const swiftFile = path.join(templateDir, `${WIDGET_TARGET_NAME}.swift`);
  if (fs.existsSync(swiftFile)) {
    fs.copyFileSync(swiftFile, path.join(targetDir, `${WIDGET_TARGET_NAME}.swift`));
    console.log(`[withWidget] Swift 파일 복사 완료`);
  }

  // Info.plist 생성
  const infoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>$(DEVELOPMENT_LANGUAGE)</string>
    <key>CFBundleDisplayName</key>
    <string>파트너 상태</string>
    <key>CFBundleExecutable</key>
    <string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key>
    <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>$(PRODUCT_NAME)</string>
    <key>CFBundlePackageType</key>
    <string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>NSExtension</key>
    <dict>
        <key>NSExtensionPointIdentifier</key>
        <string>com.apple.widgetkit-extension</string>
    </dict>
</dict>
</plist>`;
  fs.writeFileSync(path.join(targetDir, 'Info.plist'), infoPlist);
  console.log(`[withWidget] Info.plist 생성 완료`);

  return true;
}

// iOS Widget Extension 타겟 추가 및 임베드
function withIOSWidgetTarget(config) {
  return withXcodeProject(config, async (config) => {
    const xcodeProject = config.modResults;
    const projectRoot = config.modRequest.projectRoot;
    const widgetName = WIDGET_TARGET_NAME;
    const bundleId = `${config.ios.bundleIdentifier}.widget`;

    // 위젯 템플릿 파일 복사
    copyWidgetTemplates(projectRoot);

    // 위젯 폴더 경로
    const widgetPath = path.join(projectRoot, 'ios', widgetName);

    // 위젯 소스 파일들이 있는지 확인
    if (!fs.existsSync(widgetPath)) {
      console.log(`[withWidget] 위젯 폴더가 없습니다: ${widgetPath}`);
      return config;
    }

    // 이미 타겟이 있는지 확인
    const targets = xcodeProject.pbxNativeTargetSection();
    const existingTarget = Object.values(targets).find(
      (target) => target && target.name === widgetName
    );

    if (existingTarget) {
      console.log(`[withWidget] 위젯 타겟이 이미 존재합니다: ${widgetName}`);
      return config;
    }

    console.log(`[withWidget] 위젯 타겟 추가 중: ${widgetName}`);

    // 타겟 생성
    const target = xcodeProject.addTarget(
      widgetName,
      'app_extension',
      widgetName,
      bundleId
    );

    // 위젯 그룹 생성
    const widgetGroupKey = xcodeProject.pbxCreateGroup(widgetName, widgetName);

    // 위젯 소스 파일 참조 추가 (위젯 타겟에만)
    const widgetFiles = fs.readdirSync(widgetPath).filter(f => f.endsWith('.swift') || f.endsWith('.plist') || f.endsWith('.entitlements'));

    for (const file of widgetFiles) {
      const filePath = path.join(widgetName, file);

      // 파일 참조 추가
      const fileRefUuid = xcodeProject.generateUuid();
      xcodeProject.hash.project.objects['PBXFileReference'][fileRefUuid] = {
        isa: 'PBXFileReference',
        fileEncoding: 4,
        lastKnownFileType: file.endsWith('.swift') ? 'sourcecode.swift' : 'text.plist.xml',
        name: file,
        path: filePath,
        sourceTree: '"<group>"',
      };
      xcodeProject.hash.project.objects['PBXFileReference'][`${fileRefUuid}_comment`] = file;

      // 그룹에 파일 추가
      const groups = xcodeProject.hash.project.objects['PBXGroup'];
      for (const groupKey in groups) {
        const group = groups[groupKey];
        if (group && group.name === widgetName && group.children) {
          group.children.push({ value: fileRefUuid, comment: file });
          break;
        }
      }

      // Swift 파일은 위젯 타겟의 Sources 빌드 단계에만 추가
      if (file.endsWith('.swift')) {
        const buildFileUuid = xcodeProject.generateUuid();
        xcodeProject.hash.project.objects['PBXBuildFile'][buildFileUuid] = {
          isa: 'PBXBuildFile',
          fileRef: fileRefUuid,
          fileRef_comment: file,
        };
        xcodeProject.hash.project.objects['PBXBuildFile'][`${buildFileUuid}_comment`] = `${file} in Sources`;

        // 위젯 타겟의 Sources 빌드 단계에 추가
        const sourcesPhases = xcodeProject.hash.project.objects['PBXSourcesBuildPhase'];
        for (const phaseKey in sourcesPhases) {
          const phase = sourcesPhases[phaseKey];
          // 위젯 타겟의 buildPhases에서 Sources 단계를 찾아서 추가
          if (phase && phase.files && target.buildPhases) {
            const isWidgetSourcesPhase = target.buildPhases.some(bp => bp.value === phaseKey);
            if (isWidgetSourcesPhase) {
              phase.files.push({ value: buildFileUuid, comment: `${file} in Sources` });
              break;
            }
          }
        }
      }
    }

    // 빌드 설정 추가
    const configurations = xcodeProject.pbxXCBuildConfigurationSection();
    for (const key in configurations) {
      if (configurations[key].buildSettings && configurations[key].name) {
        const bs = configurations[key].buildSettings;
        if (bs.PRODUCT_NAME === `"${widgetName}"` || bs.PRODUCT_BUNDLE_IDENTIFIER === bundleId) {
          bs.SWIFT_VERSION = '5.0';
          bs.IPHONEOS_DEPLOYMENT_TARGET = '17.0';
          bs.CODE_SIGN_ENTITLEMENTS = `${widgetName}/${widgetName}.entitlements`;
          bs.INFOPLIST_FILE = `${widgetName}/Info.plist`;
          bs.LD_RUNPATH_SEARCH_PATHS = '"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"';
          bs.PRODUCT_BUNDLE_IDENTIFIER = bundleId;
          bs.TARGETED_DEVICE_FAMILY = '"1,2"';
          bs.GENERATE_INFOPLIST_FILE = 'NO';
          bs.CURRENT_PROJECT_VERSION = '1';
          bs.MARKETING_VERSION = '1.0';
          bs.SKIP_INSTALL = 'YES';
        }
      }
    }

    // 메인 앱 타겟 찾기
    let mainAppTargetKey = null;
    for (const key in targets) {
      const t = targets[key];
      if (t && t.productType === '"com.apple.product-type.application"') {
        mainAppTargetKey = key;
        break;
      }
    }

    if (mainAppTargetKey) {
      // 위젯 타겟을 메인 앱의 의존성으로 추가
      xcodeProject.addTargetDependency(mainAppTargetKey, [target.uuid]);

      // 위젯 appex 파일 참조 찾기
      const fileRefs = xcodeProject.pbxFileReferenceSection();
      let productFileRefUuid = null;
      for (const key in fileRefs) {
        const ref = fileRefs[key];
        if (ref && ref.name === `${widgetName}.appex`) {
          productFileRefUuid = key.replace(/_comment$/, '');
          break;
        }
      }

      if (productFileRefUuid) {
        // 빌드 파일 생성
        const buildFileUuid = xcodeProject.generateUuid();
        const buildFile = {
          isa: 'PBXBuildFile',
          fileRef: productFileRefUuid,
          fileRef_comment: `${widgetName}.appex`,
          settings: { ATTRIBUTES: ['RemoveHeadersOnCopy'] },
        };
        xcodeProject.hash.project.objects['PBXBuildFile'][buildFileUuid] = buildFile;
        xcodeProject.hash.project.objects['PBXBuildFile'][`${buildFileUuid}_comment`] = `${widgetName}.appex in Embed App Extensions`;

        // Copy Files Build Phase 생성 (Embed App Extensions)
        const copyPhaseUuid = xcodeProject.generateUuid();
        const copyPhase = {
          isa: 'PBXCopyFilesBuildPhase',
          buildActionMask: 2147483647,
          dstPath: '""',
          dstSubfolderSpec: 13,
          files: [{ value: buildFileUuid, comment: `${widgetName}.appex in Embed App Extensions` }],
          name: '"Embed App Extensions"',
          runOnlyForDeploymentPostprocessing: 0,
        };

        if (!xcodeProject.hash.project.objects['PBXCopyFilesBuildPhase']) {
          xcodeProject.hash.project.objects['PBXCopyFilesBuildPhase'] = {};
        }
        xcodeProject.hash.project.objects['PBXCopyFilesBuildPhase'][copyPhaseUuid] = copyPhase;
        xcodeProject.hash.project.objects['PBXCopyFilesBuildPhase'][`${copyPhaseUuid}_comment`] = 'Embed App Extensions';

        // 메인 앱 타겟에 빌드 단계 추가
        const mainTarget = targets[mainAppTargetKey];
        if (mainTarget && mainTarget.buildPhases) {
          mainTarget.buildPhases.push({ value: copyPhaseUuid, comment: 'Embed App Extensions' });
        }

        console.log(`[withWidget] 위젯 임베딩 설정 완료`);
      } else {
        console.log(`[withWidget] 위젯 appex 파일 참조를 찾을 수 없습니다`);
      }
    }

    console.log(`[withWidget] 위젯 타겟 추가 완료: ${widgetName}`);
    return config;
  });
}

// iOS 메인 앱 Entitlements에 App Group 추가
function withIOSAppGroupEntitlements(config) {
  return withEntitlementsPlist(config, (config) => {
    config.modResults['com.apple.security.application-groups'] = [APP_GROUP_ID];
    console.log(`[withWidget] App Group 추가: ${APP_GROUP_ID}`);
    return config;
  });
}

// iOS 위젯 Entitlements 파일 생성
function withIOSWidgetEntitlements(config) {
  return withXcodeProject(config, async (config) => {
    const projectRoot = config.modRequest.projectRoot;
    const entitlementsPath = path.join(projectRoot, 'ios', WIDGET_TARGET_NAME, `${WIDGET_TARGET_NAME}.entitlements`);

    const entitlementsContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.application-groups</key>
    <array>
        <string>${APP_GROUP_ID}</string>
    </array>
</dict>
</plist>`;

    fs.mkdirSync(path.dirname(entitlementsPath), { recursive: true });
    fs.writeFileSync(entitlementsPath, entitlementsContent);
    console.log(`[withWidget] 위젯 Entitlements 생성: ${entitlementsPath}`);

    return config;
  });
}

// Android 위젯 파일 복사
function copyAndroidWidgetFiles(projectRoot, packageName) {
  const templateDir = path.join(projectRoot, 'widgets', 'android');

  if (!fs.existsSync(templateDir)) {
    console.log(`[withWidget] Android 위젯 템플릿 폴더가 없습니다: ${templateDir}`);
    return;
  }

  // 패키지 경로 계산
  const packagePath = packageName.replace(/\./g, '/');

  // Kotlin 파일 복사 경로
  const kotlinDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'java', packagePath, 'widget');
  fs.mkdirSync(kotlinDir, { recursive: true });

  // XML 리소스 복사 경로
  const layoutDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res', 'layout');
  const xmlDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res', 'xml');
  fs.mkdirSync(layoutDir, { recursive: true });
  fs.mkdirSync(xmlDir, { recursive: true });

  // Kotlin 파일 복사 (패키지명 변경 포함)
  const ktFile = path.join(templateDir, 'CoupleStatusWidgetProvider.kt');
  if (fs.existsSync(ktFile)) {
    let ktContent = fs.readFileSync(ktFile, 'utf8');
    ktContent = ktContent.replace(/package com\.yourapp\.couplestatus\.widget/, `package ${packageName}.widget`);
    fs.writeFileSync(path.join(kotlinDir, 'CoupleStatusWidgetProvider.kt'), ktContent);
    console.log(`[withWidget] Kotlin 파일 복사 완료`);
  }

  // Layout XML 복사
  const layoutFile = path.join(templateDir, 'widget_couple_status.xml');
  if (fs.existsSync(layoutFile)) {
    fs.copyFileSync(layoutFile, path.join(layoutDir, 'widget_couple_status.xml'));
    console.log(`[withWidget] Layout XML 복사 완료`);
  }

  // Widget info XML 복사
  const widgetInfoFile = path.join(templateDir, 'couple_status_widget_info.xml');
  if (fs.existsSync(widgetInfoFile)) {
    fs.copyFileSync(widgetInfoFile, path.join(xmlDir, 'couple_status_widget_info.xml'));
    console.log(`[withWidget] Widget info XML 복사 완료`);
  }
}

// Android Widget Provider 추가
function withAndroidWidget(config) {
  return withAndroidManifest(config, (config) => {
    const projectRoot = config.modRequest.projectRoot;
    const packageName = config.android?.package || 'com.yourapp.couplestatus';

    // Android 위젯 파일 복사
    copyAndroidWidgetFiles(projectRoot, packageName);

    const mainApplication = config.modResults.manifest.application[0];

    if (!mainApplication.receiver) {
      mainApplication.receiver = [];
    }

    // 이미 추가되었는지 확인
    const exists = mainApplication.receiver.some(
      (r) => r.$['android:name'] === '.widget.CoupleStatusWidgetProvider'
    );

    if (!exists) {
      mainApplication.receiver.push({
        $: {
          'android:name': '.widget.CoupleStatusWidgetProvider',
          'android:exported': 'true',
          'android:label': '파트너 상태',
        },
        'intent-filter': [
          {
            action: [
              { $: { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' } },
            ],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.appwidget.provider',
              'android:resource': '@xml/couple_status_widget_info',
            },
          },
        ],
      });
      console.log('[withWidget] Android 위젯 Receiver 추가');
    }

    return config;
  });
}

module.exports = function withWidget(config) {
  return withPlugins(config, [
    withIOSAppGroupEntitlements,
    withIOSWidgetEntitlements,
    withIOSWidgetTarget,
    withAndroidWidget,
  ]);
};
