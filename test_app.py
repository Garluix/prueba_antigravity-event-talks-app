from app import app

def run_tests():
    client = app.test_client()

    # 1. Test index page
    r_home = client.get('/')
    assert r_home.status_code == 200, f"Home failed: {r_home.status_code}"
    assert b"BigQuery Release Notes" in r_home.data
    assert b"Compositor" in r_home.data
    print("[OK] GET / returned 200 OK")

    # 2. Test static assets
    r_css = client.get('/static/css/style.css')
    assert r_css.status_code == 200, f"CSS failed: {r_css.status_code}"
    assert b":root" in r_css.data
    print("[OK] GET /static/css/style.css returned 200 OK")

    r_js = client.get('/static/js/app.js')
    assert r_js.status_code == 200, f"JS failed: {r_js.status_code}"
    assert b"function loadFeed" in r_js.data
    print("[OK] GET /static/js/app.js returned 200 OK")

    # 3. Test API feed
    r_feed = client.get('/api/feed?force=1')
    assert r_feed.status_code == 200, f"API feed failed: {r_feed.status_code}"
    res = r_feed.get_json()
    assert res['success'] is True
    data = res['data']
    assert data['total_entries'] > 0
    assert data['total_updates'] > 0
    print(f"[OK] GET /api/feed returned 200 OK: {data['total_entries']} entries, {data['total_updates']} updates")

    sample = data['entries'][0]['items'][0]
    print(f"  Sample update category: {sample['category']}")
    print(f"  Sample date: {sample['date']}")
    print(f"  Sample snippet: {sample['plain_text'][:80]}...")
    print("ALL TESTS PASSED SUCCESSFULLY!")

if __name__ == '__main__':
    run_tests()
