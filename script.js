document.querySelector('.btn').addEventListener('click', function(e) {
    e.preventDefault();
    document.querySelector('#tools-section').scrollIntoView({
      behavior: 'smooth'
    });
  });
  