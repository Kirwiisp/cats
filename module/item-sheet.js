import { EntitySheetHelper } from "./helper.js";
import { ATTRIBUTE_TYPES } from "./constants.js";

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class SimpleItemSheet extends ItemSheet {
  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["cats", "sheet", "item"],
      width: 520,
      height: 480,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "description",
        },
      ],
      scrollY: [".attributes"],
    });
  }

  /** @inheritdoc */
  get template() {
    const path = "systems/cats/templates/";
    return `${path}/${this.item.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async getData(options) {
    const context = await super.getData(options);
    EntitySheetHelper.getAttributeData(context.data);
    context.systemData = context.data.system;
    context.dtypes = ATTRIBUTE_TYPES;
    context.descriptionHTML = await TextEditor.enrichHTML(
      context.systemData.description,
      {
        secrets: this.document.isOwner,
        async: true,
      }
    );
    return context;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Attribute Management
    html
      .find(".attributes")
      .on(
        "click",
        ".attribute-control",
        EntitySheetHelper.onClickAttributeControl.bind(this)
      );
    html
      .find(".groups")
      .on(
        "click",
        ".group-control",
        EntitySheetHelper.onClickAttributeGroupControl.bind(this)
      );
    html
      .find(".attributes")
      .on(
        "click",
        "a.attribute-roll",
        EntitySheetHelper.onAttributeRoll.bind(this)
      );

    // Add draggable for Macro creation
    html.find(".attributes a.attribute-roll").each((i, a) => {
      a.setAttribute("draggable", true);
      a.addEventListener(
        "dragstart",
        (ev) => {
          let dragData = ev.currentTarget.dataset;
          ev.dataTransfer.setData("text/plain", JSON.stringify(dragData));
        },
        false
      );
    });
  }

  /* -------------------------------------------- */

  /** @override */
  _getSubmitData(updateData) {
    let formData = super._getSubmitData(updateData);
    formData = EntitySheetHelper.updateAttributes(formData, this.object);
    formData = EntitySheetHelper.updateGroups(formData, this.object);
    return formData;
  }

  _getItemStatus(item) {
    switch (item.type) {
      case "talent":
        item.data.level.ordinalString();
        return "";
      case "class":
        return game.i18n.format("DND5E.LevelCount", {
          ordinal: item.data.levels.ordinalString(),
        });
      case "equipment":
      case "weapon":
        return game.i18n.localize(
          item.data.equipped ? "DND5E.Equipped" : "DND5E.Unequipped"
        );
      case "spell":
        return CONFIG.DND5E.spellPreparationModes[item.data.preparation];
      case "tool":
        return game.i18n.localize(
          item.data.proficient ? "DND5E.Proficient" : "DND5E.NotProficient"
        );
    }
  }
}
