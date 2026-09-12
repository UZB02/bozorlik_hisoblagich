class CartManager {
  constructor() {
    this.carts = [];
    this.currentCartId = null;
    this.editIndex = -1;
    this.init();
  }

  init() {
    this.loadFromStorage();
    if (this.carts.length === 0) {
      this.createCart("Bozor 1");
    }
    this.bindEvents();
    this.updateCartSelector();
    this.updateDisplay();
    this.updateBalanceUI();
  }

  bindEvents() {
    const addBtn = document.getElementById("add-btn");
    const exportBtn = document.getElementById("export-btn");
    const clearBtn = document.getElementById("clear-btn");
    const shareBtn = document.getElementById("share-btn");
    const setBalanceBtn = document.getElementById("set-balance-btn");
    const editBalanceBtn = document.getElementById("edit-balance-btn");
    const newCartBtn = document.getElementById("new-cart-btn");
    const cartSelector = document.getElementById("cart-selector");
    const deleteCartBtn = document.getElementById("delete-cart-btn");

    if (addBtn) addBtn.addEventListener("click", () => this.addItem());
    if (exportBtn) exportBtn.addEventListener("click", () => this.exportData());
    if (clearBtn) clearBtn.addEventListener("click", () => this.clearAll());
    if (shareBtn) shareBtn.addEventListener("click", () => this.shareData());
    if (setBalanceBtn)
      setBalanceBtn.addEventListener("click", () => {
        const inputVal = document.getElementById("balance-input").value;
        const parsed = parseFloat(inputVal);
        this.setBalance(isNaN(parsed) ? 0 : parsed);
      });

    if (editBalanceBtn)
      editBalanceBtn.addEventListener("click", () => this.enableBalanceEdit());

    if (newCartBtn)
      newCartBtn.addEventListener("click", () => this.showNewCartDialog());

    if (deleteCartBtn)
      deleteCartBtn.addEventListener("click", () =>
        this.showDeleteCartDialog(),
      );

    if (cartSelector)
      cartSelector.addEventListener("change", (e) =>
        this.switchCart(e.target.value),
      );

    // Enter key support for inputs with class "input"
    document.querySelectorAll(".input").forEach((input) => {
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") this.addItem();
      });
    });
  }

  loadFromStorage() {
    const saved = localStorage.getItem("bozorlik_carts");
    if (saved) {
      try {
        this.carts = JSON.parse(saved);
      } catch (e) {
        this.carts = [];
      }
    }

    const savedCurrentId = localStorage.getItem("bozorlik_current_cart");
    if (savedCurrentId && this.carts.find((c) => c.id === savedCurrentId)) {
      this.currentCartId = savedCurrentId;
    } else if (this.carts.length > 0) {
      this.currentCartId = this.carts[0].id;
    }

    this.updateBalanceUIVisibility();
  }

  saveToStorage() {
    localStorage.setItem("bozorlik_carts", JSON.stringify(this.carts));
    localStorage.setItem("bozorlik_current_cart", this.currentCartId);
  }

  getCurrentCart() {
    return this.carts.find((c) => c.id === this.currentCartId);
  }

  get items() {
    const cart = this.getCurrentCart();
    return cart ? cart.items : [];
  }

  get balance() {
    const cart = this.getCurrentCart();
    return cart ? cart.balance : 0;
  }

  createCart(name) {
    const cartId =
      "cart_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    const cart = {
      id: cartId,
      name: name || "Yangi Savat",
      balance: 0,
      items: [],
    };
    this.carts.push(cart);
    this.currentCartId = cartId;
    this.saveToStorage();
    return cart;
  }

  switchCart(cartId) {
    if (this.carts.find((c) => c.id === cartId)) {
      this.currentCartId = cartId;
      this.saveToStorage();
      this.clearForm();
      this.editIndex = -1;
      this.updateDisplay();
      this.updateBalanceUI();
      this.updateBalanceUIVisibility();
      this.updateCartSelector();
    }
  }

  deleteCart(cartId) {
    if (this.carts.length <= 1) {
      alert("Aqal-aqalli bitta savat bo'lishi kerak!");
      return false;
    }
    const index = this.carts.findIndex((c) => c.id === cartId);
    if (index > -1) {
      this.carts.splice(index, 1);
      if (this.currentCartId === cartId) {
        this.currentCartId = this.carts[0].id;
      }
      this.saveToStorage();
      this.updateCartSelector();
      this.updateDisplay();
      this.updateBalanceUI();
      this.updateBalanceUIVisibility();
      return true;
    }
    return false;
  }

  renameCart(cartId, newName) {
    const cart = this.carts.find((c) => c.id === cartId);
    if (cart) {
      cart.name = newName.trim() || "Yangi Savat";
      this.saveToStorage();
      this.updateCartSelector();
    }
  }

  updateCartSelector() {
    const selector = document.getElementById("cart-selector");
    if (!selector) return;

    selector.innerHTML = "";
    this.carts.forEach((cart) => {
      const option = document.createElement("option");
      option.value = cart.id;
      option.textContent = cart.name + ` (${cart.items.length} ta)`;
      if (cart.id === this.currentCartId) {
        option.selected = true;
      }
      selector.appendChild(option);
    });
  }

  showNewCartDialog() {
    const cartName = prompt("Savatning nomini kiriting:", "Yangi Savat");
    if (cartName !== null) {
      this.createCart(cartName);
      this.updateCartSelector();
      this.updateDisplay();
      this.updateBalanceUI();
      this.updateBalanceUIVisibility();
    }
  }

  showDeleteCartDialog() {
    if (this.carts.length <= 1) {
      alert("Aqal-aqalli bitta savat bo'lishi kerak!");
      return;
    }

    const cart = this.getCurrentCart();
    if (cart && confirm(`"${cart.name}" savatni o'chirishni xohlaysizmi?`)) {
      this.deleteCart(cart.id);
      this.updateDisplay();
      this.updateBalanceUI();
      this.updateBalanceUIVisibility();
    }
  }

  updateBalanceUIVisibility() {
    const inputGroup = document.getElementById("balance-input-group");
    const displayGroup = document.getElementById("balance-display");

    if (this.balance > 0) {
      if (inputGroup) inputGroup.style.display = "none";
      if (displayGroup) displayGroup.style.display = "block";
    } else {
      if (inputGroup) inputGroup.style.display = "flex";
      if (displayGroup) displayGroup.style.display = "none";
    }
  }

  setBalance(value) {
    const cart = this.getCurrentCart();
    if (cart) {
      cart.balance = value;
      this.saveToStorage();
      this.updateBalanceUI();
      this.updateBalanceUIVisibility();
    }
  }

  enableBalanceEdit() {
    const input = document.getElementById("balance-input");
    if (input) input.value = this.balance;

    const inputGroup = document.getElementById("balance-input-group");
    const displayGroup = document.getElementById("balance-display");
    if (inputGroup) inputGroup.style.display = "flex";
    if (displayGroup) displayGroup.style.display = "none";
  }

  formatCurrency(value) {
    const num = Number(value) || 0;
    return new Intl.NumberFormat("uz-UZ").format(num) + " so'm";
  }

  getFormData() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const formattedDate = `${day}.${month}.${year}`;
    return {
      name: document.getElementById("name").value.trim(),
      size: document.getElementById("size").value.trim(),
      quantity: document.getElementById("quantity").value.trim(),
      price: document.getElementById("price").value.trim(),
      addedAt: formattedDate,
    };
  }

  clearForm() {
    const nameEl = document.getElementById("name");
    const sizeEl = document.getElementById("size");
    const qtyEl = document.getElementById("quantity");
    const priceEl = document.getElementById("price");

    if (nameEl) nameEl.value = "";
    if (sizeEl) sizeEl.value = "";
    if (qtyEl) qtyEl.value = "";
    if (priceEl) priceEl.value = "";

    this.editIndex = -1;
    const title = document.getElementById("form-title");
    const addText = document.getElementById("add-btn-text");
    if (title) title.textContent = "Yangi mahsulot qo'shish";
    if (addText) addText.textContent = "Qo'shish";
  }

  addItem() {
    const formData = this.getFormData();
    const priceNum = Number.parseFloat(formData.price);

    if (!formData.name || isNaN(priceNum) || priceNum <= 0) {
      alert("Iltimos, mahsulot nomi va to'g'ri narxini kiriting!");
      return;
    }

    const cart = this.getCurrentCart();
    if (!cart) return;

    const newItem = {
      name: formData.name,
      size: formData.size || "",
      quantity: formData.quantity || "",
      price: priceNum,
      addedAt: formData.addedAt,
    };

    if (this.editIndex >= 0) {
      newItem.addedAt = cart.items[this.editIndex].addedAt || formData.addedAt;
      cart.items[this.editIndex] = newItem;
    } else {
      cart.items.unshift(newItem);
    }

    this.saveToStorage();
    this.clearForm();
    this.updateDisplay();
    this.updateBalanceUI();
    this.updateCartSelector();
  }

  editItem(index) {
    const cart = this.getCurrentCart();
    if (!cart) return;

    const item = cart.items[index];
    if (!item) return;

    const nameEl = document.getElementById("name");
    const sizeEl = document.getElementById("size");
    const qtyEl = document.getElementById("quantity");
    const priceEl = document.getElementById("price");

    if (nameEl) nameEl.value = item.name;
    if (sizeEl) sizeEl.value = item.size;
    if (qtyEl) qtyEl.value = item.quantity;
    if (priceEl) priceEl.value = item.price;

    this.editIndex = index;
    const title = document.getElementById("form-title");
    const addText = document.getElementById("add-btn-text");
    if (title) title.textContent = "Mahsulotni yangilash";
    if (addText) addText.textContent = "Yangilash";

    const formCard = document.querySelector(".form-card");
    if (formCard) formCard.scrollIntoView({ behavior: "smooth" });
  }

  deleteItem(index) {
    const cart = this.getCurrentCart();
    if (!cart) return;

    if (!cart.items[index]) return;
    if (confirm("Bu mahsulotni o'chirishni xohlaysizmi?")) {
      cart.items.splice(index, 1);
      if (this.editIndex === index) this.clearForm();
      else if (this.editIndex > index) this.editIndex--;
      this.saveToStorage();
      this.updateDisplay();
      this.updateBalanceUI();
      this.updateBalanceUIVisibility();
      this.updateCartSelector();
    }
  }

  calculateItemTotal(item) {
    const qty = Number.parseFloat(item.quantity) || 0;
    const size = Number.parseFloat(item.size) || 0;
    const basePrice = Number.parseFloat(item.price) || 0;

    if (qty > 0) return basePrice * qty;
    if (size > 0) return basePrice * size;
    return basePrice;
  }

  calculateTotal() {
    return this.items.reduce(
      (sum, item) => sum + this.calculateItemTotal(item),
      0,
    );
  }

  updateDisplay() {
    const itemCount = document.getElementById("item-count");
    const emptyState = document.getElementById("empty-state");
    const itemsTable = document.getElementById("items-table");
    const tbody = document.getElementById("items-tbody");
    const totalAmount = document.getElementById("total-amount");

    if (itemCount) itemCount.textContent = `${this.items.length} ta mahsulot`;

    if (this.items.length === 0) {
      if (emptyState) emptyState.style.display = "block";
      if (itemsTable) itemsTable.style.display = "none";
    } else {
      if (emptyState) emptyState.style.display = "none";
      if (itemsTable) itemsTable.style.display = "block";
    }

    if (tbody) {
      tbody.innerHTML = "";
      this.items.forEach((item, index) => {
        const row = document.createElement("tr");
        const itemTotal = this.calculateItemTotal(item);

        row.innerHTML = `
        <td><strong>${this.escapeHtml(item.name)}</strong></td>
        <td style="text-align: center;">${
          this.escapeHtml(item.size) || "-"
        }</td>
        <td style="text-align: center;">${
          this.escapeHtml(item.quantity) || "-"
        }</td>
        <td style="text-align: center;">${this.formatCurrency(item.price)}</td>
        <td style="text-align: center;">${this.formatCurrency(itemTotal)}</td>
        <td style="text-align: center;">${item.addedAt || "-"}</td>
        <td style="text-align: center;">
          <button class="edit-btn" data-index="${index}">✏️</button>
          <button class="delete-btn" data-index="${index}">🗑️</button>
        </td>
      `;
        tbody.appendChild(row);
      });

      tbody
        .querySelectorAll(".edit-btn")
        .forEach((btn) =>
          btn.addEventListener("click", () =>
            this.editItem(Number(btn.getAttribute("data-index"))),
          ),
        );

      tbody
        .querySelectorAll(".delete-btn")
        .forEach((btn) =>
          btn.addEventListener("click", () =>
            this.deleteItem(Number(btn.getAttribute("data-index"))),
          ),
        );
    }

    if (totalAmount)
      totalAmount.textContent = this.formatCurrency(this.calculateTotal());
  }

  escapeHtml(text) {
    if (!text) return "";
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  clearAll() {
    const cart = this.getCurrentCart();
    if (!cart) return;

    if (confirm("Haqiqatan ham barcha ma'lumotlarni tozalashni xohlaysizmi?")) {
      cart.items = [];
      this.editIndex = -1;
      this.saveToStorage();
      this.clearForm();
      this.updateDisplay();
      this.updateBalanceUI();
      this.updateBalanceUIVisibility();
      this.updateCartSelector();
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
    const dateStr = now.toLocaleString("uz-UZ");
    const cart = this.getCurrentCart();

    doc.setFontSize(16);
    doc.text(cart.name + " - Bozorlik Ro'yxati", 20, 20);

    doc.setFontSize(10);
    doc.text(`Yuklab olingan sana: ${dateStr}`, 20, 28);

    const head = [
      ["#", "Mahsulot", "Hajm(kg/litr)", "Miqdor(dona)", "Narx", "Umumiy"],
    ];

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

    let finalY = 40;
    if (doc.autoTable) {
      doc.autoTable({
        startY: 40,
        head: head,
        body: body,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });
      finalY = doc.lastAutoTable.finalY;
    } else {
      let y = 40;
      body.forEach((r) => {
        doc.text(r.join(" | "), 20, y);
        y += 6;
      });
      finalY = y;
    }

    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("Web Developer  M.Mirzamatov", pageWidth / 2, pageHeight - 10, {
      align: "center",
    });

    const pad = (n) => String(n).padStart(2, "0");
    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const filenameDate = `${year}-${month}-${day}_${hours}${minutes}`;
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
    const cart = this.getCurrentCart();

    doc.setFontSize(16);
    doc.text(cart.name + " - Bozorlik Ro'yxati", 20, 20);
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

    let finalY = 40;
    if (doc.autoTable) {
      doc.autoTable({
        startY: 40,
        head: head,
        body: body,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });
      finalY = doc.lastAutoTable.finalY;
    } else {
      let y = 40;
      body.forEach((r) => {
        doc.text(r.join(" | "), 20, y);
        y += 6;
      });
      finalY = y;
    }

    const total = this.calculateTotal();
    const remaining = (this.balance || 0) - total;

    doc.setFontSize(12);
    doc.text(`Balans: ${this.formatCurrency(this.balance)}`, 20, finalY + 10);
    if (remaining >= 0) {
      doc.text(
        `Balansdan qaytkan summa: ${this.formatCurrency(remaining)}`,
        20,
        finalY + 18,
      );
    } else {
      doc.text(
        `Balansdan tashqari xarajat: ${this.formatCurrency(remaining)}`,
        20,
        finalY + 18,
      );
    }

    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("Web Developer  M.Mirzamatov", pageWidth / 2, pageHeight - 10, {
      align: "center",
    });

    const pdfBlob = doc.output("blob");

    const pad = (n) => String(n).padStart(2, "0");
    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const filenameDate = `${year}-${month}-${day}_${hours}${minutes}`;
    const filename = `bozorlik_${filenameDate}.pdf`;

    const file = new File([pdfBlob], filename, { type: "application/pdf" });

    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      navigator
        .share({
          title: cart.name + " - Bozorlik Ro'yxati",
          text: "Mana mening bozorlik ro'yxatim 📋",
          files: [file],
        })
        .catch((err) => console.log("Ulashishda xato:", err));
    } else {
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      alert("Ulashish qo'llab-quvvatlanmadi, fayl yuklab olindi!");
    }
  }

  updateBalanceUI() {
    const currentEl = document.getElementById("current-balance");
    const remainingEl = document.getElementById("remaining-balance");

    const total = this.calculateTotal();
    let remaining = (this.balance || 0) - total;

    if (this.items.length === 0) {
      remaining = 0;
    }

    if (currentEl) currentEl.textContent = this.formatCurrency(this.balance);
    if (remainingEl) {
      remainingEl.textContent = this.formatCurrency(remaining);
      remainingEl.style.color = remaining < 0 ? "red" : "green";
    }

    const totalAmountEl = document.getElementById("total-amount");
    if (totalAmountEl) {
      totalAmountEl.textContent =
        this.items.length === 0
          ? this.formatCurrency(0)
          : this.formatCurrency(total);
    }
  }
}

// Instansiya yaratish
window.cartManager = new CartManager();
