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
      this.items.push(newItem);
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

    doc.setFontSize(12);
    let y = 40;
    this.items.forEach((item, i) => {
      const itemTotal = this.calculateItemTotal(item);
      const line = `${i + 1}. ${item.name} | Hajm: ${
        item.size || "-"
      } | Miqdor: ${item.quantity || "-"} | Narx: ${this.formatCurrency(
        item.price
      )} | Umumiy: ${this.formatCurrency(itemTotal)}`;
      doc.text(line, 20, y);
      y += 8;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    y += 10;
    doc.setFontSize(14);
    doc.text(`Jami: ${this.formatCurrency(this.calculateTotal())}`, 20, y);

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
}

// global qilib chiqarish kerak
window.calculator = new ShoppingCalculator();
