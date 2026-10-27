const closePopupBtn = document.getElementById("closePopupBtn");
const popup = document.getElementById("configPopup");

closePopupBtn.addEventListener("click", () => {
    popup.style.display = "none";
});

const config = document.getElementById("configBtn");

configBtn.addEventListener("click", () => {
    if (popup.style.display === "flex") {
        popup.style.display = "none"
        return;
    }
    
    popup.style.display = "flex";
});
