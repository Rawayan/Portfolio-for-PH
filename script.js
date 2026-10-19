document.getElementById("f").addEventListener("submit", function (e) {
  e.preventDefault();
  var d = new FormData(e.target);
  var b =
    "Name: " + d.get("n") + "\nEmail: " + d.get("e") + "\n\n" + d.get("p");
  location.href =
    "mailto:rawfir.ayan@gmail.com?subject=" +
    encodeURIComponent("Portfolio enquiry from " + d.get("n")) +
    "&body=" +
    encodeURIComponent(b);
});
