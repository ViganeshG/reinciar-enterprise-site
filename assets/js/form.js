'use strict';

/**
 * Google Sheets via Apps Script Web App.
 * Sheet: https://docs.google.com/spreadsheets/d/1EifYCaS3Ha-BgtEWN66uD01Duv4ZMejBl-WC5zOe_UI/edit
 * Tab name must match SHEET_TAB in Apps Script (currently "Submissions").
 */
const FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzliA9EYNL9qMoA1AUHfqWFHiCcwk5xUDo5WTHmyW27i3rFef9wRmZyyTupCtYFEqaS/exec';

(function () {
    const form = document.getElementById('briefingForm');
    if (!form) return;

    const formStatus = document.getElementById('formStatus');
    const fsBody = document.getElementById('fsBody');
    const fsIcon = document.getElementById('fsIcon');
    const submitBtn = document.getElementById('formSubmit');

    if (!formStatus || !fsBody || !fsIcon || !submitBtn) return;

    const ICON_OK = '<path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/>';
    const ICON_ER = '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.5"/>';

    let isSubmitting = false;

    function sanitize(value, maxLen) {
        if (typeof value !== 'string') return '';
        return value
            .replace(/[<>]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, maxLen || 500);
    }

    function getFieldGroup(el) {
        return el ? el.closest('.form-group') : null;
    }

    function setStatus(kind, title, body) {
        formStatus.classList.remove('is-success', 'is-error', 'is-visible');
        void formStatus.offsetWidth;
        if (!kind) return;
        formStatus.classList.add('is-visible', kind === 'success' ? 'is-success' : 'is-error');
        fsIcon.innerHTML = kind === 'success' ? ICON_OK : ICON_ER;
        fsBody.innerHTML = '<strong>' + title + '</strong><span>' + body + '</span>';
    }

    function clearFieldError(group) {
        if (!group) return;
        group.classList.remove('has-error');
    }

    function validateForm() {
        let firstInvalid = null;
        form.querySelectorAll('[required]').forEach(function (input) {
            const group = getFieldGroup(input);
            let ok = input.checkValidity();
            if (input.type === 'email' && ok) {
                ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
            }
            if (input.name === 'message' && ok) {
                ok = sanitize(input.value, 2000).length >= 10;
            }
            if (!ok) {
                if (group) group.classList.add('has-error');
                if (!firstInvalid) firstInvalid = input;
            } else if (group) {
                group.classList.remove('has-error');
            }
        });
        return firstInvalid;
    }

    form.querySelectorAll('.form-group input, .form-group select, .form-group textarea').forEach(function (el) {
        el.addEventListener('input', function () {
            clearFieldError(getFieldGroup(el));
        });
        el.addEventListener('change', function () {
            clearFieldError(getFieldGroup(el));
        });
    });

    function setLoading(loading) {
        const label = submitBtn.querySelector('.btn-label');
        if (loading) {
            submitBtn.classList.add('is-loading');
            submitBtn.disabled = true;
            submitBtn.setAttribute('aria-busy', 'true');
            if (label) label.textContent = 'Sending…';
        } else {
            submitBtn.classList.remove('is-loading');
            submitBtn.disabled = false;
            submitBtn.removeAttribute('aria-busy');
            if (label) label.textContent = 'Send request';
        }
    }

    function buildPayload() {
        const payload = new URLSearchParams();
        const fields = ['name', 'email', 'phone', 'company', 'service', 'size', 'message', 'company_url'];
        fields.forEach(function (name) {
            const el = form.querySelector('[name="' + name + '"]');
            if (!el) return;
            let val = el.value || '';
            if (name !== 'company_url' && val) {
                val = sanitize(val, name === 'message' ? 2000 : 120);
                el.value = val;
            }
            payload.append(name, val);
        });
        payload.append('timestamp', new Date().toISOString());
        payload.append('source', window.location.hostname + ' — executive briefing form');
        payload.append('user_agent', navigator.userAgent.slice(0, 240));
        return payload;
    }

    function postToGoogleSheet(payload) {
        return fetch(FORM_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
            body: payload.toString()
        }).then(function (res) {
            return res.text().then(function (text) {
                if (text.indexOf('"ok":false') !== -1) {
                    var errMatch = text.match(/"error":"([^"]*)"/);
                    throw new Error(errMatch ? errMatch[1] : 'Sheet rejected the submission');
                }
                if (text.indexOf('"ok":true') !== -1) return;
                if (res.ok) return;
                throw new Error('Unexpected response (HTTP ' + res.status + ')');
            });
        });
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (isSubmitting) return;

        const invalid = validateForm();
        if (invalid) {
            invalid.focus({ preventScroll: false });
            setStatus(
                'error',
                'Please complete the required fields.',
                'Highlighted fields need your attention before we can route this to a consultant.'
            );
            return;
        }

        const honey = form.querySelector('input[name="company_url"]');
        if (honey && honey.value) {
            setStatus('success', 'Request received.', 'A principal consultant will be in touch within one business day.');
            form.reset();
            return;
        }

        if (FORM_ENDPOINT.includes('REPLACE_WITH_YOUR_DEPLOYMENT_ID')) {
            setStatus(
                'error',
                'Form not configured yet.',
                'Set the Google Apps Script web app URL in assets/js/form.js (FORM_ENDPOINT), then redeploy.'
            );
            return;
        }

        isSubmitting = true;
        setLoading(true);
        setStatus(null);

        const payload = buildPayload();

        postToGoogleSheet(payload)
            .then(function () {
                setStatus(
                    'success',
                    'Request received.',
                    'A principal consultant will reach out within one business day to schedule your briefing.'
                );
                form.reset();
                formStatus.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            })
            .catch(function (err) {
                console.error('Form submission failed:', err);
                setStatus(
                    'error',
                    'We couldn’t submit your request.',
                    'Please try again, or email <a href="mailto:info@reinciar.com" style="color:inherit;text-decoration:underline;">info@reinciar.com</a> directly.'
                );
            })
            .finally(function () {
                isSubmitting = false;
                setLoading(false);
            });
    });
})();

/*
========== COPY THIS ENTIRE BLOCK INTO APPS SCRIPT (Code.gs) ==========

const SHEET_ID = '1EifYCaS3Ha-BgtEWN66uD01Duv4ZMejBl-WC5zOe_UI';
const SHEET_TAB = 'Submissions';

const HEADERS = [
  'Timestamp', 'Full Name', 'Email', 'Phone', 'Company',
  'Service Interest', 'Organization Size', 'Message', 'Source', 'User Agent'
];

function getSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_TAB);
  if (!sheet) {
    throw new Error('Tab not found: ' + SHEET_TAB);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doPost(e) {
  try {
    const p = (e && e.parameter) ? e.parameter : {};
    if (p.company_url) {
      return ContentService.createTextOutput(JSON.stringify({ ok: true, skipped: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    getSheet_().appendRow([
      p.timestamp || new Date().toISOString(),
      p.name || '',
      p.email || '',
      p.phone || '',
      p.company || '',
      p.service || '',
      p.size || '',
      p.message || '',
      p.source || '',
      p.user_agent || ''
    ]);
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput('Reinciar form endpoint OK.')
    .setMimeType(ContentService.MimeType.TEXT);
}

========== THEN: Deploy → Manage deployments → Edit → New version → Deploy ==========
Access: Anyone | Execute as: Me

Optional: paste these headers manually in row 1 of "Submissions" (script adds them automatically on first submit if row 1 is empty):
Timestamp | Full Name | Email | Phone | Company | Service Interest | Organization Size | Message | Source | User Agent
*/
