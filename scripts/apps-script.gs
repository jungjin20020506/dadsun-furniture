/**
 * 가구전문가 아빠와 아들 — 견적 접수 Apps Script (v4)
 *
 * 하는 일
 *  1) 홈페이지 견적 신청을 구글 시트에 한 줄 추가
 *  2) 고객이 올린 사진 "전부"(최대 6장)를 구글 드라이브 폴더에 저장 (신청 건마다 폴더 하나)
 *  3) 사장님 이메일로 즉시 알림
 *     - 메일 본문에 사진 전부가 바로 보임 (링크 안 눌러도 됨)
 *     - "사진 전부 보기" 버튼 하나로 드라이브 폴더(앨범처럼 넘겨보기) 열기
 *     - 사진 파일도 전부 첨부 (용량이 크면 첨부만 생략, 본문·드라이브는 유지)
 *  4) 드라이브가 실패해도 메일은 반드시 보냄 (사진은 본문에 포함)
 *
 * 설치: MANUAL.md 1단계. 붙여넣고 저장한 뒤, 먼저 위의 함수 선택에서 `testSend` 를 한 번 실행하세요.
 *       (권한 허용 창이 뜨면 허용 → 테스트 메일이 오면 성공) 그 다음 [배포] → [배포 관리] → 새 버전 → 배포.
 */

var VERSION = 4;
var NOTIFY_EMAIL = "jung22459369@gmail.com";      // 알림 받을 이메일
var DRIVE_FOLDER_NAME = "아빠와아들_견적사진";      // 사진이 저장될 드라이브 폴더 이름 (없으면 자동 생성)
var MAX_ATTACH_BYTES = 18 * 1024 * 1024;          // 첨부 총량 한도 (Gmail 25MB 안전선)

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var result = handleQuote_(data);
    return json_({ result: "ok", version: VERSION, photos: result.photoCount, saved: result.savedCount });
  } catch (err) {
    try {
      MailApp.sendEmail(NOTIFY_EMAIL, "⚠️ 견적 접수 처리 중 오류", String(err) + "\n\n" + (e && e.postData ? String(e.postData.contents).slice(0, 2000) : ""));
    } catch (e2) {}
    return json_({ result: "error", version: VERSION, msg: String(err) });
  }
}

// 브라우저에서 주소를 직접 열었을 때 (버전 확인용)
function doGet() {
  return json_({ result: "ok", version: VERSION, msg: "아빠와 아들 견적 접수 스크립트 v" + VERSION + " 작동 중 (사진 여러 장 지원)" });
}

/**
 * 테스트: 스크립트 편집기에서 이 함수를 선택해 ▶ 실행하면
 * 홈페이지 사진 3장으로 실제 접수와 똑같이 처리해 테스트 메일을 보냅니다.
 * (처음 실행할 때 권한 허용 창이 뜹니다 — 허용하셔야 실제 접수도 동작합니다)
 */
function testSend() {
  var urls = ["https://www.dadsun-furniture.com/1.jpg", "https://www.dadsun-furniture.com/2.jpg", "https://www.dadsun-furniture.com/3.jpg"];
  var photos = urls.map(function (u, i) {
    var blob = UrlFetchApp.fetch(u).getBlob();
    return { data: "data:image/jpeg;base64," + Utilities.base64Encode(blob.getBytes()), name: "사진" + (i + 1) + ".jpg" };
  });
  var r = handleQuote_({
    service: "테스트 (삭제해도 됨)", province: "경기/수도권", city: "화성",
    content: "스크립트 v" + VERSION + " 설치 테스트입니다.\n이 메일 본문에 사진 3장이 모두 보이면 성공!",
    dateNone: true, phone: "010-0000-0000", photos: photos, agreedPrivacy: true, source: "testSend"
  });
  Logger.log("테스트 완료: 사진 " + r.photoCount + "장, 드라이브 저장 " + r.savedCount + "장 → " + NOTIFY_EMAIL + " 메일함을 확인하세요.");
}

// ───────────────────────── 실제 처리 ─────────────────────────
function handleQuote_(data) {
  var now = new Date();
  var region = ((data.province || "") + " " + (data.city || "")).trim();
  var when = data.dateNone ? "날짜무관" : (data.date || "");
  var phone = data.phone || "번호없음";
  var tel = phone.replace(/[^0-9]/g, "");

  // ── 1. 사진 목록 (새 홈페이지: photos 배열 / 예전 홈페이지: photoData 1장) ──
  var photos = Array.isArray(data.photos) ? data.photos : [];
  if (!photos.length && data.photoData) photos = [{ data: data.photoData, name: data.photoName || "사진1.jpg" }];

  // ── 2. 먼저 사진을 전부 메모리로 디코딩 (드라이브와 무관하게 메일 본문에 쓰기 위해) ──
  var blobs = [];
  for (var i = 0; i < photos.length; i++) {
    try {
      var b = dataUrlToBlob_(photos[i] && photos[i].data, "사진" + (i + 1) + ".jpg");
      if (b) blobs.push(b);
    } catch (err) { /* 깨진 사진 1장은 건너뜀 */ }
  }

  // ── 3. 드라이브 저장 (실패해도 계속 진행) ──
  var folderUrl = "", fileUrls = [], driveError = "";
  if (blobs.length) {
    try {
      var root = getOrCreateFolder_(DRIVE_FOLDER_NAME);
      var stamp = Utilities.formatDate(now, "Asia/Seoul", "yyyy-MM-dd HH:mm");
      var sub = root.createFolder(stamp + " · " + phone + " · " + (data.service || "") + " · " + region);
      folderUrl = sub.getUrl();
      for (var j = 0; j < blobs.length; j++) {
        try { fileUrls.push(sub.createFile(blobs[j]).getUrl()); } catch (err) { fileUrls.push(""); }
      }
    } catch (err) { driveError = String(err); }
  }

  // ── 4. 구글 시트 기록 ──
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    sheet.appendRow([
      now, data.service || "", region, data.content || "", when, phone,
      blobs.length, folderUrl || (driveError ? "드라이브 저장 실패: " + driveError : ""),
      data.agreedPrivacy ? "동의" : "", data.source || ""
    ]);
  } catch (err) { /* 시트 실패가 메일을 막지 않도록 */ }

  // ── 5. 이메일 (본문에 사진 전부 + 폴더 버튼 + 첨부) ──
  var subject = "📋 새 견적신청 (사진 " + blobs.length + "장) " + (data.service || "") + " / " + region + " / " + phone;
  var inline = {};
  var photoHtml = "";
  for (var k = 0; k < blobs.length; k++) {
    var cid = "photo" + (k + 1);
    inline[cid] = blobs[k];
    var open = fileUrls[k] ? '<a href="' + fileUrls[k] + '" style="text-decoration:none;color:inherit">' : "";
    var close = fileUrls[k] ? "</a>" : "";
    photoHtml +=
      '<div style="margin:0 0 18px">' +
      '<div style="font-size:13px;color:#777;margin:0 0 6px">사진 ' + (k + 1) + " / " + blobs.length + (fileUrls[k] ? " · 탭하면 드라이브에서 원본 보기" : "") + "</div>" +
      open + '<img src="cid:' + cid + '" alt="사진 ' + (k + 1) + '" style="display:block;width:100%;max-width:640px;height:auto;border-radius:10px;border:1px solid #e5e2dc">' + close +
      "</div>";
  }

  var html =
    '<div style="font-family:-apple-system,BlinkMacSystemFont,Apple SD Gothic Neo,Malgun Gothic,sans-serif;font-size:15px;line-height:1.7;color:#1a1714;max-width:680px">' +
    '<h2 style="margin:0 0 14px;font-size:20px">새 견적 신청 — 사진 ' + blobs.length + "장</h2>" +
    '<table style="border-collapse:collapse;margin:0 0 16px">' +
    row_("서비스", esc_(data.service)) + row_("지역", esc_(region)) + row_("내용", esc_(data.content).replace(/\n/g, "<br>")) +
    row_("희망일", esc_(when)) + row_("연락처", '<a href="tel:' + tel + '" style="font-size:18px;font-weight:bold;color:#1a1714">' + esc_(phone) + "</a>") +
    row_("개인정보 동의", data.agreedPrivacy ? "동의" : "미동의") +
    "</table>" +
    '<div style="margin:0 0 22px">' +
    btn_("tel:" + tel, "📞 바로 전화", "#1a1714") +
    (folderUrl ? btn_(folderUrl, "📂 사진 " + blobs.length + "장 전부 보기 (드라이브)", "#8a5a2b") : "") +
    "</div>" +
    (driveError ? '<p style="color:#b45309;font-size:13px">⚠️ 드라이브 저장은 실패했지만 사진은 아래에 모두 포함되어 있습니다. (' + esc_(driveError) + ")</p>" : "") +
    (blobs.length ? photoHtml : "<p>첨부된 사진 없음</p>") +
    '<p style="color:#999;font-size:12px;margin-top:20px">가구전문가 아빠와 아들 · 홈페이지 견적 자동 알림 (스크립트 v' + VERSION + ")</p>" +
    "</div>";

  var lines = [
    "■ 서비스: " + (data.service || ""), "■ 지역: " + region, "■ 내용: " + (data.content || ""),
    "■ 희망일: " + when, "■ 연락처: " + phone, "■ 사진: " + blobs.length + "장",
    "■ 개인정보 동의: " + (data.agreedPrivacy ? "동의" : "미동의"), "",
    "▶ 바로 전화: tel:" + tel
  ];
  if (folderUrl) lines.push("▶ 사진 전부 보기: " + folderUrl);

  var mail = { to: NOTIFY_EMAIL, subject: subject, body: lines.join("\n"), htmlBody: html };
  if (blobs.length) {
    mail.inlineImages = inline;
    var total = 0;
    for (var t = 0; t < blobs.length; t++) total += blobs[t].getBytes().length;
    if (total * 2 <= MAX_ATTACH_BYTES) mail.attachments = blobs;   // 본문 포함 + 첨부, 합계가 한도 안일 때만 첨부
  }
  MailApp.sendEmail(mail);

  return { photoCount: blobs.length, savedCount: fileUrls.filter(Boolean).length, folderUrl: folderUrl };
}

// ───────────────────────── 보조 함수 ─────────────────────────
// data:image/jpeg;base64,.... → 파일 blob
function dataUrlToBlob_(dataUrl, name) {
  if (!dataUrl || typeof dataUrl !== "string") return null;
  var m = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
  var mime = m ? m[1] : "image/jpeg";
  var b64 = m ? m[2] : dataUrl;
  var bytes = Utilities.base64Decode(b64);
  if (!bytes || !bytes.length) return null;
  return Utilities.newBlob(bytes, mime, name);
}

function getOrCreateFolder_(name) {
  var it = DriveApp.getFoldersByName(name);
  return it.hasNext() ? it.next() : DriveApp.createFolder(name);
}

function btn_(href, label, bg) {
  return '<a href="' + href + '" style="display:inline-block;margin:0 10px 10px 0;padding:12px 18px;background:' + bg + ';color:#fff;font-weight:bold;border-radius:10px;text-decoration:none">' + label + "</a>";
}

function row_(k, v) {
  return '<tr><td style="padding:4px 12px 4px 0;color:#777;white-space:nowrap;vertical-align:top">' + k + '</td><td style="padding:4px 0">' + (v || "") + "</td></tr>";
}

function esc_(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
