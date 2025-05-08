const imageInput = document.getElementById("imageInput");
const preview = document.getElementById("preview");

imageInput.addEventListener("change", () => {
  preview.innerHTML = "";
  for (const file of imageInput.files) {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    preview.appendChild(img);
  }
});

async function generatePDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  for (let i = 0; i < imageInput.files.length; i++) {
    const file = imageInput.files[i];
    const img = await fileToImage(file);
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext("2d").drawImage(img, 0, 0);
    const imgData = canvas.toDataURL("image/jpeg");

    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, "JPEG", 10, 10, 190, 0);
  }

  pdf.save("images.pdf");
}

function fileToImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
