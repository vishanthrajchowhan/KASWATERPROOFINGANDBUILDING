// Smooth scroll to #contact when any .service-btn or .btn-quote is clicked
// (except if already an anchor link)
document.addEventListener('DOMContentLoaded', function() {
    function scrollToContact() {
        const contactSection = document.getElementById('contact');
        if (contactSection) {
            contactSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // For nav button (already an anchor, so let browser handle)
    // For service cards' buttons
    document.querySelectorAll('.service-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            scrollToContact();
        });
    });

    // If you want nav .btn-quote to also smooth scroll (optional, since it's an anchor)
    document.querySelectorAll('.btn-quote').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            // Only override if not already at #contact
            if (window.location.hash !== '#contact') {
                e.preventDefault();
                scrollToContact();
            }
        });
    });
});
