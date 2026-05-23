'use strict';

(function () {
    const io = 'IntersectionObserver' in window
        ? new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' })
        : null;

    document.querySelectorAll('.reveal').forEach(function (el) {
        if (io) io.observe(el);
        else el.classList.add('visible');
    });
})();
