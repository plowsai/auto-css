// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
  const menuToggle = document.getElementById('menu-toggle');
  const mainNav = document.querySelector('.main-nav');
  
  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', function() {
      mainNav.classList.toggle('active');
      menuToggle.classList.toggle('active');
    });
  }
  
  // Form submission handling
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Simple form validation
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const subject = document.getElementById('subject').value;
      const message = document.getElementById('message').value;
      
      if (name && email && subject && message) {
        // In a real application, you would send this data to a server
        alert('Thank you for your message! We will get back to you soon.');
        contactForm.reset();
      } else {
        alert('Please fill in all fields.');
      }
    });
  }
  
  // Testimonial slider
  const testimonials = document.querySelectorAll('.testimonial-card');
  let currentTestimonial = 0;
  
  function showTestimonial(index) {
    testimonials.forEach((testimonial, i) => {
      if (i === index) {
        testimonial.style.opacity = '1';
        testimonial.style.transform = 'translateX(0)';
      } else {
        testimonial.style.opacity = '0';
        testimonial.style.transform = 'translateX(100%)';
      }
    });
  }
  
  // Initialize testimonials
  if (testimonials.length > 0) {
    testimonials.forEach((testimonial, i) => {
      if (i !== 0) {
        testimonial.style.opacity = '0';
        testimonial.style.transform = 'translateX(100%)';
      }
    });
    
    // Auto-rotate testimonials
    setInterval(() => {
      currentTestimonial = (currentTestimonial + 1) % testimonials.length;
      showTestimonial(currentTestimonial);
    }, 5000);
  }
  
  // Smooth scrolling for navigation links
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href').substring(1);
      const targetSection = document.getElementById(targetId);
      
      if (targetSection) {
        window.scrollTo({
          top: targetSection.offsetTop - 80, // Adjust for header height
          behavior: 'smooth'
        });
        
        // Close mobile menu if open
        mainNav.classList.remove('active');
        menuToggle.classList.remove('active');
      }
    });
  });
}); 