'use strict';

(function () {
    const navEl = document.getElementById('nav');
    const hamburger = document.getElementById('hamburger');
    const navMobile = document.getElementById('navMobile');
    const navBackdrop = document.getElementById('navBackdrop');
    const heroEl = document.getElementById('hero');

    if (!navEl || !hamburger || !navMobile || !navBackdrop) return;

    navMobile.setAttribute('aria-hidden', 'true');
    navBackdrop.setAttribute('aria-hidden', 'true');

    function syncNavHeight() {
        const h = navEl.offsetHeight;
        document.documentElement.style.setProperty('--nav-h', h + 'px');
        document.documentElement.style.setProperty('--scroll-offset', (h + 20) + 'px');
    }

    syncNavHeight();
    window.addEventListener('resize', syncNavHeight);

    /* ── Hero intersection: transparent nav over dark hero ── */
    if (heroEl && 'IntersectionObserver' in window) {
        const heroObserver = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    navEl.classList.toggle('nav--hero', entry.isIntersecting);
                });
            },
            { threshold: 0.12 }
        );
        heroObserver.observe(heroEl);
        /* Set initial state synchronously so there's no flash on load */
        navEl.classList.add('nav--hero');
    }

    function openMobileNav() {
        hamburger.classList.add('active');
        navMobile.classList.add('active');
        navBackdrop.classList.add('active');
        hamburger.setAttribute('aria-expanded', 'true');
        navBackdrop.setAttribute('aria-hidden', 'false');
        navMobile.setAttribute('aria-hidden', 'false');
        document.body.classList.add('nav-open');
    }

    function closeMobileNav() {
        hamburger.classList.remove('active');
        navMobile.classList.remove('active');
        navBackdrop.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        navBackdrop.setAttribute('aria-hidden', 'true');
        navMobile.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('nav-open');
    }

    function toggleMobileNav() {
        if (navMobile.classList.contains('active')) closeMobileNav();
        else openMobileNav();
    }

    window.closeMobileNav = closeMobileNav;

    hamburger.addEventListener('click', toggleMobileNav);
    navBackdrop.addEventListener('click', closeMobileNav);

    navMobile.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', closeMobileNav);
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && navMobile.classList.contains('active')) {
            closeMobileNav();
            hamburger.focus();
        }
    });

    function onScroll() {
        navEl.classList.toggle('scrolled', window.scrollY > 8);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    let resizeTimer;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            if (window.innerWidth > 900 && navMobile.classList.contains('active')) {
                closeMobileNav();
            }
        }, 120);
    });
})();
