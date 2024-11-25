document.addEventListener("DOMContentLoaded", () => {
  // Handle login form submission
  const loginForm = document.querySelector(".sign-in-form");
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault(); // Prevent form from refreshing the page
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (email && password) {
      alert(`Welcome back, ${email}!`);
      // Redirect to another page
      window.location.href = "dashboard.html"; // Change 'dashboard.html' to your desired page
    } else {
      alert("Please enter valid login credentials.");
    }
  });

  // Handle sign-up form submission
  const signUpForm = document.querySelector(".sign-up-form");
  signUpForm.addEventListener("submit", (event) => {
    event.preventDefault(); // Prevent form from refreshing the page
    const username = signUpForm.querySelector("input[placeholder='Username']").value;
    const email = signUpForm.querySelector("input[placeholder='Email']").value;
    const password = signUpForm.querySelector("input[placeholder='Password']").value;

    if (username && email && password) {
      alert(`Thank you for signing up, ${username}! Your account is ready.`);
      // Redirect to a login page or a welcome page
      window.location.href = "https://text-file-compressor-rust.vercel.app/Dashboard/dashboard.html"; // Change 'welcome.html' to your desired page
    } else {
      alert("Please fill in all the fields to sign up.");
    }
  });

  // Add functionality to switch between login and sign-up panels
  const signUpBtn = document.getElementById("sign-up-btn");
  const signInBtn = document.getElementById("sign-in-btn");
  const container = document.querySelector(".container");

  signUpBtn.addEventListener("click", () => {
    container.classList.add("sign-up-mode");
  });

  signInBtn.addEventListener("click", () => {
    container.classList.remove("sign-up-mode");
  });
});
