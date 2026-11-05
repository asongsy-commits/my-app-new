// 개발 단위 1: data-config.json을 읽어 원장·양식·결과 폴더의 경로를 가져온다.
// 서버 쪽 코드(API, 서버 컴포넌트)에서만 사용한다. (파일 시스템을 읽기 때문)

import fs from "node:fs";
import path from "node:path";

// data-config.json에 적힌 값의 모양 (모두 프로젝트 폴더 기준 상대 경로)
export type DataConfig = {
  ledgerFolder: string; // 엑셀 원장이 있는 폴더
  ledgerFile: string; // 엑셀 원장 파일 이름
  supplementFile: string; // 보강 데이터(CSV) 파일 이름
  pdfFolder: string; // 양도증서 양식이 있는 폴더
  formFile: string; // 양도증서 양식 파일 이름
  outputFolder: string; // 결과 PDF를 저장할 폴더
};

// 코드에서 바로 쓸 수 있도록 전체 경로(절대 경로)로 바꾼 값
export type ResolvedConfig = {
  ledgerPath: string;
  supplementPath: string;
  formPath: string;
  outputFolder: string;
};

const CONFIG_FILE_NAME = "data-config.json";

// 설정 파일에서 꼭 있어야 하는 항목들
const REQUIRED_KEYS: (keyof DataConfig)[] = [
  "ledgerFolder",
  "ledgerFile",
  "supplementFile",
  "pdfFolder",
  "formFile",
  "outputFolder",
];

// 프로젝트 폴더 밖으로 나가는 경로는 막는다. (예: ../../다른폴더)
function resolveInsideProject(root: string, ...parts: string[]): string {
  const resolved = path.resolve(root, ...parts);
  const relative = path.relative(root, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(
      `설정 경로가 프로젝트 폴더 밖을 가리킵니다: ${parts.join("/")}`
    );
  }
  return resolved;
}

// data-config.json을 읽어 검사한 뒤, 전체 경로로 바꿔서 돌려준다.
// projectRoot를 따로 주지 않으면 현재 실행 중인 프로젝트 폴더를 쓴다.
export function loadConfig(projectRoot: string = process.cwd()): ResolvedConfig {
  const configPath = path.join(projectRoot, CONFIG_FILE_NAME);

  if (!fs.existsSync(configPath)) {
    throw new Error(`설정 파일을 찾을 수 없습니다: ${CONFIG_FILE_NAME}`);
  }

  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } catch {
    throw new Error(`${CONFIG_FILE_NAME}의 내용이 올바른 JSON이 아닙니다.`);
  }

  // 모든 항목이 비어 있지 않은 글자인지 확인한다.
  const config = raw as Partial<Record<keyof DataConfig, unknown>>;
  for (const key of REQUIRED_KEYS) {
    const value = config?.[key];
    if (typeof value !== "string" || value.trim() === "") {
      throw new Error(`${CONFIG_FILE_NAME}에 '${key}' 항목이 없거나 비어 있습니다.`);
    }
  }
  const c = config as DataConfig;

  return {
    ledgerPath: resolveInsideProject(projectRoot, c.ledgerFolder, c.ledgerFile),
    supplementPath: resolveInsideProject(projectRoot, c.ledgerFolder, c.supplementFile),
    formPath: resolveInsideProject(projectRoot, c.pdfFolder, c.formFile),
    outputFolder: resolveInsideProject(projectRoot, c.outputFolder),
  };
}
