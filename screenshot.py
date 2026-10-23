from playwright.sync_api import sync_playwright
import sys
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width":1280,"height":1400}, device_scale_factor=1, user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36", extra_http_headers={"sec-ch-ua": "\"Google Chrome\";v=\"141\""}, timezone_id="Europe/Rome")
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: m.type=="error" and errs.append(m.text))
    pg.goto("http://localhost:8765/"); pg.wait_for_function("document.getElementById('status').textContent.indexOf('Controllo')<0", timeout=60000)
    pg.screenshot(path="screenshot.png", full_page=False)
    # interaction test
    pg.fill("#q","caitlin"); pg.wait_for_timeout(300); pg.keyboard.press("Enter"); pg.wait_for_timeout(300)
    pg.click("text=P+R+A"); pg.click("text=Stagione >> nth=0"); pg.wait_for_timeout(300)
    print("title2:", pg.inner_text("#pname"), "|", pg.inner_text("#charttitle"))
    pg.screenshot(path="/tmp/s2.png")
    print("errors:", errs); b.close()
