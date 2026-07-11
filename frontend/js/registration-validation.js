/**
 * registration-validation.js
 * Real-time client-side form validation with visual feedback
 */
(function () {
  "use strict";

  const VALIDATION_RULES = {
    name: {
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[a-zA-Z\s'\-]+$/,
      messages: {
        required: "$ Error: Full name is required_",
        minLength: "$ Error: Name must be at least 2 characters_",
        maxLength: "$ Error: Name must be under 100 characters_",
        pattern:
          "$ Error: Name may only contain letters, spaces, hyphens, and apostrophes_",
      },
    },
    leetcodeId: {
      required: true,
      minLength: 3,
      maxLength: 30,
      pattern: /^[A-Za-z0-9_\-]+$/,
      messages: {
        required: "$ Error: LeetCode username is required_",
        minLength: "$ Error: Username must be at least 3 characters_",
        maxLength: "$ Error: Username must be under 30 characters_",
        pattern:
          "$ Error: Username may only contain letters, numbers, underscores, and hyphens_",
      },
    },
  };

  const DEBOUNCE_MS = 300;

  function debounce(fn, ms) {
    let timer;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, ms);
    };
  }

  function validateField(fieldName, value) {
    const rules = VALIDATION_RULES[fieldName];
    if (!rules) return { valid: true, message: "" };

    const trimmed = value.trim();

    if (rules.required && trimmed.length === 0) {
      return { valid: false, message: rules.messages.required };
    }
    if (trimmed.length < rules.minLength) {
      return { valid: false, message: rules.messages.minLength };
    }
    if (trimmed.length > rules.maxLength) {
      return { valid: false, message: rules.messages.maxLength };
    }
    if (rules.pattern && !rules.pattern.test(trimmed)) {
      return { valid: false, message: rules.messages.pattern };
    }

    return { valid: true, message: "" };
  }

  function getFieldWrapper(input) {
    return input.closest(".form-group") || input.parentElement;
  }

  function updateFieldUI(input, errorEl, valid, message) {
    const wrapper = getFieldWrapper(input);

    if (valid) {
      input.classList.remove("input-error");
      input.classList.add("input-valid");
      wrapper.classList.remove("field-invalid");
      wrapper.classList.add("field-valid");
    } else {
      input.classList.remove("input-valid");
      input.classList.add("input-error");
      wrapper.classList.remove("field-valid");
      wrapper.classList.add("field-invalid");
    }

    errorEl.textContent = message || "";
    errorEl.setAttribute("aria-live", "polite");

    if (!valid) {
      input.setAttribute("aria-invalid", "true");
      input.setAttribute("aria-describedby", errorEl.id);
    } else {
      input.removeAttribute("aria-invalid");
    }
  }

  function clearValidation(input, errorEl) {
    const wrapper = getFieldWrapper(input);
    input.classList.remove("input-error", "input-valid");
    wrapper.classList.remove("field-invalid", "field-valid");
    errorEl.textContent = "";
    input.removeAttribute("aria-invalid");
  }

  function updateCharCount(input, countEl) {
    const rules = VALIDATION_RULES[input.name];
    if (!rules || !countEl) return;

    const len = input.value.trim().length;
    countEl.textContent = len + " / " + rules.maxLength;

    if (len > rules.maxLength) {
      countEl.classList.add("char-count-over");
      countEl.classList.remove("char-count-ok");
    } else if (len > rules.maxLength * 0.8) {
      countEl.classList.add("char-count-warn");
      countEl.classList.remove("char-count-ok", "char-count-over");
    } else {
      countEl.classList.add("char-count-ok");
      countEl.classList.remove("char-count-warn", "char-count-over");
    }
  }

  function isFormValid(form) {
    const nameInput = form.querySelector('[name="name"]');
    const lcInput = form.querySelector('[name="leetcodeId"]');
    if (!nameInput || !lcInput) return false;

    const nameResult = validateField("name", nameInput.value);
    const lcResult = validateField("leetcodeId", lcInput.value);
    return nameResult.valid && lcResult.valid;
  }

  function updateSubmitButton(form) {
    const btn = form.querySelector("#registerBtn");
    if (!btn) return;

    const valid = isFormValid(form);
    btn.disabled = !valid;
    btn.classList.toggle("btn-disabled", !valid);
  }

  function setupFieldValidation(form) {
    const fields = [
      { name: "name", selector: '[name="name"]', errorId: "name-error" },
      {
        name: "leetcodeId",
        selector: '[name="leetcodeId"]',
        errorId: "username-error",
      },
    ];

    fields.forEach(function (field) {
      const input = form.querySelector(field.selector);
      const errorEl = document.getElementById(field.errorId);
      if (!input || !errorEl) return;

      let countEl = null;
      const existingCount = input.parentElement.querySelector(".char-count");
      if (existingCount) {
        countEl = existingCount;
      }

      const debouncedValidate = debounce(function () {
        const result = validateField(field.name, input.value);
        updateFieldUI(input, errorEl, result.valid, result.message);
        updateSubmitButton(form);
      }, DEBOUNCE_MS);

      input.addEventListener("input", function () {
        updateCharCount(input, countEl);
        debouncedValidate();
      });

      input.addEventListener("blur", function () {
        const result = validateField(field.name, input.value);
        updateFieldUI(input, errorEl, result.valid, result.message);
        updateSubmitButton(form);
      });

      input.addEventListener("focus", function () {
        if (input.classList.contains("input-error")) return;
        clearValidation(input, errorEl);
      });
    });
  }

  function addCharCounts(form) {
    var fields = form.querySelectorAll(".form-input");
    fields.forEach(function (input) {
      if (!input.name || !VALIDATION_RULES[input.name]) return;
      if (input.parentElement.querySelector(".char-count")) return;

      var countEl = document.createElement("span");
      countEl.className = "char-count char-count-ok";
      countEl.setAttribute("aria-hidden", "true");
      countEl.textContent = "0 / " + VALIDATION_RULES[input.name].maxLength;
      input.parentElement.style.position = "relative";
      input.parentElement.appendChild(countEl);
    });
  }

  function init() {
    var form = document.getElementById("registrationForm");
    if (!form) return;

    form.setAttribute("novalidate", "novalidate");

    addCharCounts(form);
    setupFieldValidation(form);
    updateSubmitButton(form);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
