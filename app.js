class ShoppingCalculator {
  constructor() {
    this.items = [];
    this.editIndex = -1;
    this.init();
  }

  init() {
    this.loadFromStorage();
    this.bindEvents();
    this.updateDisplay();
  }

  bindEvents() {
    document
      .getElementById("add-btn")
      .addEventListener("click", () => this.addItem());
    document
      .getElementById("export-btn")
      .addEventListener("click", () => this.exportData());
    document
      .getElementById("clear-btn")
      .addEventListener("click", () => this.clearAll());
    document
      .getElementById("share-btn")
      .addEventListener("click", () => this.shareData());
    // Enter key support
    document.querySelectorAll(".input").forEach((input) => {
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") this.addItem();
      });
    });
  }

  loadFromStorage() {
    const saved = localStorage.getItem("bozorlik");
    if (saved) this.items = JSON.parse(saved);
  }

  saveToStorage() {
    localStorage.setItem("bozorlik", JSON.stringify(this.items));
  }

  formatCurrency(value) {
    return new Intl.NumberFormat("uz-UZ").format(value) + " so'm";
  }

  getFormData() {
    return {
      name: document.getElementById("name").value.trim(),
      size: document.getElementById("size").value.trim(),
      quantity: document.getElementById("quantity").value.trim(),
      price: document.getElementById("price").value.trim(),
    };
  }

  clearForm() {
    document.getElementById("name").value = "";
    document.getElementById("size").value = "";
    document.getElementById("quantity").value = "";
    document.getElementById("price").value = "";
    this.editIndex = -1;
    document.getElementById("form-title").textContent =
      "Yangi mahsulot qo'shish";
    document.getElementById("add-btn-text").textContent = "Qo'shish";
  }

  addItem() {
    const formData = this.getFormData();
    const priceNum = Number.parseFloat(formData.price);

    if (!formData.name || isNaN(priceNum) || priceNum <= 0) {
      alert("Iltimos, mahsulot nomi va narxini kiriting!");
      return;
    }

    const newItem = {
      name: formData.name,
      size: formData.size,
      quantity: formData.quantity,
      price: priceNum,
    };

    if (this.editIndex >= 0) {
      this.items[this.editIndex] = newItem;
    } else {
      this.items.unshift(newItem);
    }

    this.saveToStorage();
    this.clearForm();
    this.updateDisplay();
  }

  editItem(index) {
    const item = this.items[index];
    document.getElementById("name").value = item.name;
    document.getElementById("size").value = item.size;
    document.getElementById("quantity").value = item.quantity;
    document.getElementById("price").value = item.price;

    this.editIndex = index;
    document.getElementById("form-title").textContent = "Mahsulotni yangilash";
    document.getElementById("add-btn-text").textContent = "Yangilash";

    document.querySelector(".form-card").scrollIntoView({ behavior: "smooth" });
  }

  deleteItem(index) {
    if (confirm("Bu mahsulotni o'chirishni xohlaysizmi?")) {
      this.items.splice(index, 1);
      this.saveToStorage();
      this.updateDisplay();
      if (this.editIndex === index) this.clearForm();
      else if (this.editIndex > index) this.editIndex--;
    }
  }

  calculateItemTotal(item) {
    const qty = Number.parseFloat(item.quantity) || 0;
    const size = Number.parseFloat(item.size) || 0;
    const basePrice = Number.parseFloat(item.price);
    if (qty > 0) return basePrice * qty;
    else if (size > 0) return basePrice * size;
    else return basePrice;
  }

  calculateTotal() {
    return this.items.reduce(
      (sum, item) => sum + this.calculateItemTotal(item),
      0
    );
  }

  updateDisplay() {
    const itemCount = document.getElementById("item-count");
    const emptyState = document.getElementById("empty-state");
    const itemsTable = document.getElementById("items-table");
    const tbody = document.getElementById("items-tbody");
    const totalAmount = document.getElementById("total-amount");

    itemCount.textContent = `${this.items.length} ta mahsulot`;

    if (this.items.length === 0) {
      emptyState.style.display = "block";
      itemsTable.style.display = "none";
    } else {
      emptyState.style.display = "none";
      itemsTable.style.display = "block";
    }

    tbody.innerHTML = "";
    this.items.forEach((item, index) => {
      const row = document.createElement("tr");
      const itemTotal = this.calculateItemTotal(item);

      row.innerHTML = `
        <td><strong>${item.name}</strong></td>
        <td style="text-align: center;">${item.size || "-"}</td>
        <td style="text-align: center;">${item.quantity || "-"}</td>
        <td style="text-align: center;">${this.formatCurrency(item.price)}</td>
        <td style="text-align: center;">${this.formatCurrency(itemTotal)}</td>
        <td style="text-align: center;">
          <button onclick="calculator.editItem(${index})">✏️</button>
          <button onclick="calculator.deleteItem(${index})">🗑️</button>
        </td>
      `;
      tbody.appendChild(row);
    });

    totalAmount.textContent = this.formatCurrency(this.calculateTotal());
  }

  clearAll() {
    if (confirm("Haqiqatan ham barcha ma'lumotlarni tozalashni xohlaysizmi?")) {
      this.items = [];
      localStorage.removeItem("bozorlik");
      this.clearForm();
      this.updateDisplay();
    }
  }

  exportData() {
    if (this.items.length === 0) {
      alert("Eksport qilish uchun mahsulotlar qo'shing!");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const now = new Date();
    const dateStr = now.toLocaleString("uz-UZ"); // PDF ichida ko‘rsatish uchun

    doc.setFontSize(16);
    doc.text("Bozorlik Ro'yxati", 20, 20);

    doc.setFontSize(10);
    doc.text(`Yuklab olingan sana: ${dateStr}`, 20, 28);

    // Jadval ustunlari
    const head = [
      ["#", "Mahsulot", "Hajm(kg/litr)", "Miqdor(dona)", "Narx", "Umumiy"],
    ];

    // Jadval ma'lumotlari
    const body = this.items.map((item, i) => [
      i + 1,
      item.name || "-",
      item.size || "-",
      item.quantity || "-",
      this.formatCurrency(item.price),
      this.formatCurrency(this.calculateItemTotal(item)),
    ]);

    // Jami qatorini qo‘shish
    body.push([
      {
        content: "Jami",
        colSpan: 5,
        styles: { halign: "right", fontStyle: "bold" },
      },
      this.formatCurrency(this.calculateTotal()),
    ]);

    // Jadvalni chizish
    doc.autoTable({
      startY: 40,
      head: head,
      body: body,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] }, // ko‘k sarlavha
      alternateRowStyles: { fillColor: [245, 245, 245] }, // almashib turadigan rang
    });

    // === P E C H A T ===
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    doc.setFontSize(10);
    doc.setTextColor(150); // kulrang rang
    doc.text("Web Developer  M.Mirzamatov", pageWidth / 2, pageHeight - 10, {
      align: "center",
    });

    // Fayl nomini 24 soatlik formatda chiqarish (YYYY-MM-DD_HH:mm)
    const pad = (n) => String(n).padStart(2, "0");
    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());
    const hours = pad(now.getHours()); // 0-23 oralig‘ida
    const minutes = pad(now.getMinutes());

    const filenameDate = `${year}-${month}-${day}_${hours}:${minutes}`;
    const filename = `bozorlik_${filenameDate}.pdf`;

    doc.save(filename);
  }

  shareData() {
    if (this.items.length === 0) {
      alert("Ulashish uchun mahsulotlar qo'shing!");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const now = new Date();
    const dateStr = now.toLocaleString("uz-UZ");

    doc.setFontSize(16);
    doc.text("Bozorlik Ro'yxati", 20, 20);
    doc.setFontSize(10);
    doc.text(`Yuklab olingan sana: ${dateStr}`, 20, 28);

    const head = [["#", "Mahsulot", "Hajm", "Miqdor", "Narx", "Umumiy"]];
    const body = this.items.map((item, i) => [
      i + 1,
      item.name || "-",
      item.size || "-",
      item.quantity || "-",
      this.formatCurrency(item.price),
      this.formatCurrency(this.calculateItemTotal(item)),
    ]);
    body.push([
      {
        content: "Jami",
        colSpan: 5,
        styles: { halign: "right", fontStyle: "bold" },
      },
      this.formatCurrency(this.calculateTotal()),
    ]);

    doc.autoTable({
      startY: 40,
      head: head,
      body: body,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    // 🔥 Watermark / Pechat qo'shish
    doc.setFontSize(30);
    doc.setTextColor(150, 150, 150); // kulrang
    doc.text("Web Developer M.Mirzamatov", 105, 150, {
      align: "center",
      angle: 45, // qiya qilib yozish
    });

    // PDF blob olish
    const pdfBlob = doc.output("blob");

    const pad = (n) => String(n).padStart(2, "0");
    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());

    const filenameDate = `${year}-${month}-${day}_${hours}:${minutes}`;
    const filename = `bozorlik_${filenameDate}.pdf`;

    const file = new File([pdfBlob], filename, { type: "application/pdf" });

    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      navigator
        .share({
          title: "Bozorlik Ro'yxati",
          text: "Mana mening bozorlik ro'yxatim 📋",
          files: [file],
        })
        .catch((err) => console.log("Ulashishda xato:", err));
    } else {
      // fallback: yuklab olish
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      alert("Ulashish qo'llab-quvvatlanmadi, fayl yuklab olindi!");
    }
  }
}

// global qilib chiqarish kerak
window.calculator = new ShoppingCalculator();
