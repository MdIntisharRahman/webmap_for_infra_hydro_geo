import re

# 1. Update index.html
with open('frontend/index.html', 'r') as f:
    html = f.read()

modal_html = """
    <!-- Iframe Modal -->
    <div id="iframe-modal" class="iframe-modal hidden">
        <div class="iframe-modal-backdrop" id="iframe-modal-backdrop"></div>
        <div class="iframe-modal-content">
            <button class="iframe-modal-close" id="iframe-modal-close" aria-label="Close modal">&times;</button>
            <iframe id="iframe-modal-frame" src="" frameborder="0"></iframe>
        </div>
    </div>
"""
if "iframe-modal" not in html:
    html = html.replace('</body>', modal_html + '\n</body>')

# bump cache buster again
html = html.replace('styles.css?v=20', 'styles.css?v=21')
html = html.replace('app.js?v=24', 'app.js?v=25')

with open('frontend/index.html', 'w') as f:
    f.write(html)

# 2. Update styles.css
with open('frontend/styles.css', 'r') as f:
    css = f.read()

modal_css = """
/* Iframe Modal */
.iframe-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 10000;
    display: flex;
    justify-content: center;
    align-items: center;
}
.iframe-modal.hidden {
    display: none;
}
.iframe-modal-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(13, 40, 56, 0.4);
    backdrop-filter: blur(6px);
}
.iframe-modal-content {
    position: relative;
    width: 90%;
    max-width: 800px;
    height: 85vh;
    background: transparent;
    border-radius: 8px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    z-index: 10001;
    overflow: hidden;
    animation: modalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.iframe-modal-close {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.85);
    border: 1px solid rgba(82, 82, 82, 0.2);
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 24px;
    cursor: pointer;
    z-index: 10002;
    color: #313845;
    transition: all 0.2s;
    backdrop-filter: blur(4px);
    line-height: 1;
    padding-bottom: 2px;
}
.iframe-modal-close:hover {
    background: #ffffff;
    color: #000;
    transform: scale(1.05);
}
#iframe-modal-frame {
    width: 100%;
    height: 100%;
    border: none;
    background: transparent;
}
@keyframes modalFadeIn {
    from { opacity: 0; transform: translateY(10px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
}
"""
if ".iframe-modal" not in css:
    with open('frontend/styles.css', 'a') as f:
        f.write(modal_css)

# 3. Update app.js
with open('frontend/app.js', 'r') as f:
    app_js = f.read()

old_click = """                    e.stopPropagation();
                    window.open(crBtn.dataset.url, '_blank');"""
new_click = """                    e.stopPropagation();
                    const modal = document.getElementById('iframe-modal');
                    const frame = document.getElementById('iframe-modal-frame');
                    frame.src = crBtn.dataset.url;
                    modal.classList.remove('hidden');"""

if old_click in app_js:
    app_js = app_js.replace(old_click, new_click)
    
    # Add modal close handlers at the end if not exists
    close_handlers = """
// Modal close handlers
const iframeModal = document.getElementById('iframe-modal');
const iframeClose = document.getElementById('iframe-modal-close');
const iframeBackdrop = document.getElementById('iframe-modal-backdrop');

if (iframeModal) {
    const closeModal = () => {
        iframeModal.classList.add('hidden');
        document.getElementById('iframe-modal-frame').src = '';
    };
    iframeClose.addEventListener('click', closeModal);
    iframeBackdrop.addEventListener('click', closeModal);
}
"""
    if "// Modal close handlers" not in app_js:
        app_js += close_handlers
        
    with open('frontend/app.js', 'w') as f:
        f.write(app_js)
    print("JS patched")
else:
    print("Failed to patch JS")

