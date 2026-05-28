'use strict';

(function () {
    const SCROLL_GUTTER = 20;

    function getScrollOffset() {
        const navEl = document.getElementById('nav');
        return (navEl ? navEl.offsetHeight : 72) + SCROLL_GUTTER;
    }

    function scrollToSection(id) {
        const el = document.getElementById(id);
        if (!el) return;
        const top = el.getBoundingClientRect().top + window.pageYOffset - getScrollOffset();
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
        if (typeof window.closeMobileNav === 'function') window.closeMobileNav();
        if (history.replaceState) {
            history.replaceState(null, '', '#' + id);
        } else {
            location.hash = id;
        }
    }

    window.scrollToSection = scrollToSection;

    document.addEventListener('click', function (e) {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;
        const hash = link.getAttribute('href');
        if (!hash || hash === '#') return;
        const id = hash.slice(1);
        const target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        scrollToSection(id);
    });

    document.querySelectorAll('.hv-bar').forEach(function (b) {
        const w = b.classList.contains('b1') ? '88%' :
            b.classList.contains('b2') ? '64%' : '92%';
        b.style.setProperty('--w', w);
    });

    const target = new Date('2027-12-31T23:59:59Z').getTime();
    const cdDays = document.getElementById('cdDays');
    const cdHours = document.getElementById('cdHours');
    const cdMinutes = document.getElementById('cdMinutes');
    const cdSeconds = document.getElementById('cdSeconds');

    if (cdDays && cdHours && cdMinutes && cdSeconds) {
        function pad(n, len) {
            return String(Math.max(0, n)).padStart(len, '0');
        }

        function tick() {
            const diff = target - Date.now();
            if (diff <= 0) {
                cdDays.textContent = '000';
                cdHours.textContent = cdMinutes.textContent = cdSeconds.textContent = '00';
                return;
            }
            cdDays.textContent = pad(Math.floor(diff / 86400000), 3);
            cdHours.textContent = pad(Math.floor((diff % 86400000) / 3600000), 2);
            cdMinutes.textContent = pad(Math.floor((diff % 3600000) / 60000), 2);
            cdSeconds.textContent = pad(Math.floor((diff % 60000) / 1000), 2);
        }

        tick();
        setInterval(tick, 1000);
    }

    const methodTrack = document.getElementById('methodTrack');
    const mSteps = document.querySelectorAll('.m-step');

    function updateMethodProgress() {
        if (!methodTrack || !mSteps.length) return;
        const rect = methodTrack.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        const total = rect.height + vh * 0.6;
        const traveled = Math.min(Math.max(vh - rect.top, 0), total);
        const ratio = Math.min(traveled / total, 1);
        methodTrack.style.setProperty('--progress', (ratio * 100) + '%');

        const stepRatio = 1 / mSteps.length;
        mSteps.forEach(function (step, i) {
            step.classList.toggle('active', ratio >= stepRatio * i);
        });
    }

    window.addEventListener('scroll', updateMethodProgress, { passive: true });
    window.addEventListener('resize', updateMethodProgress);
    updateMethodProgress();

    window.addEventListener('load', function () {
        if (!location.hash) return;
        const id = location.hash.slice(1);
        const el = document.getElementById(id);
        if (!el) return;
        const top = el.getBoundingClientRect().top + window.pageYOffset - getScrollOffset();
        window.scrollTo(0, Math.max(0, top));
    });

    // Card flip — service cards and tool cards
    document.querySelectorAll('.service-card, .tool-card').forEach(function (card) {
        card.addEventListener('click', function (e) {
            // CTA links and [data-no-flip] anchors handle their own action — don't flip
            if (e.target.closest('[data-no-flip]')) return;
            card.classList.toggle('flipped');
        });
    });
})();
