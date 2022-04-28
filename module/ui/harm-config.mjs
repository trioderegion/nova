export class HarmConfig extends Dialog {

  constructor(item, dialogData, options = {}) {
    super(dialogData, options)
    this.item = item
    this.options.classes = ['nova', 'dialog']
  }

  static async create(actor, harmData) {

    let data = {
      ...harmData,
      rangeSelect: CONFIG.NOVA.range,
      targetSelect: CONFIG.NOVA.target,
      costResource: CONFIG.NOVA.costResource,
      localLabels: {
        min: `(${game.i18n.localize('Minimum')})`,
        max: `(${game.i18n.localize('Maximum')})`,
      }
    }
    
    const html = await renderTemplate('systems/nova/templates/item/apps/harm-config.html', data);

    return new Promise(resolve => {
      const dlg = new this(actor, {
        content: html,
        title: game.i18n.format('NOVA.HarmConfigTitle', {name: harmData.name}),
        buttons: {
          save: {
            icon: '<i class="fas fa-save"></i>',
            label: game.i18n.localize("Save Changes"),
            callback: html => resolve(HarmConfig._parseHarmForm(html)),
          }
        },
        default: 'save',
        close: () => resolve(false)
      });
      dlg.render(true); 
    });
    
  }

  static _parseHarmForm(html) {
    const harmData = {
      name: html[0].querySelector("[name=name]").value,
      harm: html[0].querySelector("[name=harm]").value,
      cost: {
        value: html[0].querySelector("[name=cost]").value,
        source: html[0].querySelector("[name=resource]").value
      },
      target: {
        type: html[0].querySelector("[name=target]").value,
        value: html[0].querySelector("[name=quantity]").value,
      },
      range: {
        min: html[0].querySelector("[name=range-min]").value,
        max: html[0].querySelector("[name=range-max]").value,
      },
      special: html[0].querySelector("[name=special]").value,
    }
        
    return harmData;
  }

}
