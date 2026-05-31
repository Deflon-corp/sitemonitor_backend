const fs = require("fs").promises;
const path = require("path");

/**
 * Load and compile template with provided data
 * @param {string} templatePath - Path to the template file
 * @param {Object} data - Data to substitute in the template
 * @returns {Promise<string>} - Compiled template string
 */
async function loadTemplate(templateName, data = {}) {
  try {
    const filePath = path.join(__dirname, "..", "common", "templates", "email", `${templateName}.template.html`);
    let content = await fs.readFile(filePath, "utf8");

    // Replace placeholders like {{key}} with data[key]
    for (const key in data) {
      const placeholder = new RegExp(`{{${key}}}`, "g");
      content = content.replace(placeholder, data[key]);
    }

    return content;
  } catch (error) {
    console.error(`Error loading template ${templateName}:`, error);
    throw error;
  }
}

module.exports = {
  loadTemplate,
};
