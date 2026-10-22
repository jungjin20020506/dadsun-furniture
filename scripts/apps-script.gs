/**
 * 가구전문가 아빠와 아들 — 견적 접수 Apps Script (v3)
 *
 * 하는 일
 *  1) 홈페이지 견적 신청을 구글 시트에 한 줄 추가
 *  2) 고객이 올린 사진 "전부"(최대 6장)를 구글 드라이브 폴더에 저장
 *  3) 사장님 이메일로 즉시 알림 — 사진 전부를 메일에 첨부 + 드라이브 링크 포함
 *
 * 설치 방법은 MANUAL.md 1단계를 보세요.
 *  (기존 doPost 코드를 지우고 이 파일 내용 전체를 붙여넣기 → 저장 → 배포 관리 → 새 버전 → 배포)
 */

var NOTIFY_EMAIL = "jung22459369@gmail.com";      // 알림 받을 이메일
var DRIVE_FOLDER_NAME = "아빠와아들_견적사진";      // 사진이 저장될 드라이브 폴더 이름 (없으면 자동 생성)

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var now = new Date();
    var region = ((data.province || "") + " " + (data.city || "")).trim();
    var when = data.dateNone ? "날짜무관" : (data.date || "");
    var phone = data.phone || "번호없음";

    // ── 사진 목록 정리 (새 홈페이지: photos 배열 / 예전 홈페이지: photoData 1장) ──
    var photos = Array.isArray(data.photos) ? data.photos : [];
    if (!photos.length && data.photoData) {
      photos = [{ data: data.photoData, name: data.photoName || "사진1.jpg" }];
    }

    // ── 사진을 드라이브에 저장하고, 메일 첨부용으로도 준비 ──
    var blobs = [];
    var links = [];
    if (photos.length) {
      var root = getOrCreateFolder_(DRIVE_FOLDER_NAME);
      var stamp = Utilities.formatDate(now, "Asia/Seoul", "yyyyMMdd_HHmm");
      var sub = root.createFolder(stamp + "_" + phone + "_" + (data.service || ""));
      for (var i = 0; i < photos.length; i++) {
        try {
          var blob = dataUrlToBlob_(photos[i].data, "사진" + (i + 1) + ".jpg");
          if (!blob) continue;
          var file = sub.createFile(blob);
          links.push(file.getUrl());
          blobs.push(blob);
        } catch (err) {
          // 사진 하나가 깨져도 나머지는 계속 처리
        }
      }
    }

    // ── 구글 시트에 기록 ──
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheets()[0];
    sheet.appendRow([
      now, data.service || "", region, data.content || "", when, phone,
      photos.length, links.join("\n"), data.agreedPrivacy ? "동의" : "", data.source || ""
    ]);

    // ── 이메일 알림 (사진 전부 첨부) ──
    var subject = "📋 새 견적신청 (사진 " + photos.length + "장) " + (data.service || "") + " / " + region + " / " + phone;
    var lines = [
      "■ 서비스: " + (data.service || ""),
      "■ 지역: " + region,
      "■ 내용: " + (data.content || ""),
      "■ 희망일: " + when,
      "■ 연락처: " + phone,
      "■ 사진: " + photos.length + "장 (아래 첨부 + 드라이브 링크)",
      "■ 개인정보 동의: " + (data.agreedPrivacy ? "동의" : "미동의"),
      "",
      "▶ 바로 전화: tel:" + phone.replace(/[^0-9]/g, ""),
      ""
    ];
    for (var k = 0; k < links.length; k++) lines.push("사진 " + (k + 1) + ": " + links[k]);

    var html =
      '<div style="font-family:sans-serif;font-size:15px;line-height:1.8">' +
      '<h2 style="margin:0 0 12px">새 견적 신청 — 사진 ' + photos.length + '장</h2>' +
      '<table style="border-collapse:collapse">' +
      row_("서비스", data.service) + row_("지역", region) + row_("내용", String(data.content || "").replace(/\n/g, "<br>")) +
      row_("희망일", when) + row_("연락처", '<a href="tel:' + phone.replace(/[^0-9]/g, "") + '" style="font-size:18px;font-weight:bold">' + phone + "</a>") +
      "</table>" +
      (links.length ? "<p><b>드라이브에 저장된 사진</b><br>" + links.map(function (l, i) { return '<a href="' + l + '">사진 ' + (i + 1) + "</a>"; }).join(" · ") + "</p>" : "<p>첨부된 사진 없음</p>") +
      "</div>";

    var mail = { to: NOTIFY_EMAIL, subject: subject, body: lines.join("\n"), htmlBody: html };
    if (blobs.length) mail.attachments = blobs;   // ★ 사진 전부 첨부 (메일 한도 25MB 이내)
    MailApp.sendEmail(mail);

    return json_({ result: "ok", photos: photos.length });
  } catch (err) {
    return json_({ result: "error", msg: String(err) });
  }
}

// 브라우저 미리보기용 (주소를 직접 열었을 때)
function doGet() {
  return json_({ result: "ok", msg: "아빠와 아들 견적 접수 스크립트가 켜져 있습니다." });
}

// data:image/jpeg;base64,.... → 파일 blob
function dataUrlToBlob_(dataUrl, name) {
  if (!dataUrl || typeof dataUrl !== "string") return null;
  var m = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
  var mime = m ? m[1] : "image/jpeg";
  var b64 = m ? m[2] : dataUrl;
  return Utilities.newBlob(Utilities.base64Decode(b64), mime, name);
}

function getOrCreateFolder_(name) {
  var it = DriveApp.getFoldersByName(name);
  return it.hasNext() ? it.next() : DriveApp.createFolder(name);
}

function row_(k, v) {
  return '<tr><td style="padding:4px 12px 4px 0;color:#777;white-space:nowrap">' + k + "</td><td style=\"padding:4px 0\">" + (v || "") + "</td></tr>";
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
