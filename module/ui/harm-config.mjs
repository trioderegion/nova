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
    }
    
    const html = await renderTemplate('systems/nova/templates/item/apps/harm-config.html', data);

    return new Promise(resolve => {
      const dlg = new this(actor, {
        content: html,
        buttons: {
          save: {
            icon: '<i class="fas fa-save"></i>',
            label: 'Save',
            callback: html => resolve(true),
          }
        },
        default: 'save',
        close: () => resolve(false)
      });
      dlg.render(true); 
    });
    
  }

}
