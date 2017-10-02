module.exports = Backbone.View.extend({

  events: {
    click: 'active',
    'click [data-close-layer]': 'remove',
    'mousedown [data-move-layer]': 'initSorter'
  },

  template(model) {
    const pfx = this.pfx;
    const label = `Layer ${model.get('index')}`;

    return `
      <div id="${pfx}move" data-move-layer>
        <i class="fa fa-arrows"></i>
      </div>
      <div id="${pfx}label">${label}</div>
      <div id="${pfx}preview-box">
      	<div id="${pfx}preview" data-preview></div>
      </div>
      <div id="${pfx}close-layer" class="${pfx}btn-close" data-close-layer>
        &Cross;
      </div>
      <div id="${pfx}inputs" data-properties></div>
      <div style="clear:both"></div>
    `
  },

  initialize(o = {}) {
    let model = this.model;
    this.stackModel = o.stackModel || {};
    this.config = o.config || {};
    this.pfx = this.config.stylePrefix || '';
    this.sorter = o.sorter || null;
    this.propsConfig = o.propsConfig || {};
    this.customPreview = o.onPreview;
    this.listenTo(model, 'destroy remove', this.remove);
    this.listenTo(model, 'change:value', this.valueChanged);
    this.listenTo(model, 'change:active', this.updateVisibility);
    this.listenTo(model, 'change:props', this.showProps);
    this.listenTo(model.get('properties'), 'change', this.updatePreview);

    if (!model.get('preview')) {
      this.$el.addClass(this.pfx + 'no-preview');
    }

    // For the sorter
    model.view = this;
    model.set({droppable: 0, draggable: 1});
    this.$el.data('model', model);
  },

  /**
   * Delegate sorting
   * @param  {Event} e
   * */
  initSorter(e) {
    if(this.sorter)
      this.sorter.startSort(this.el);
  },

  /**
   * Returns properties
   * @return {Collection|null}
   *
  getProps() {
    if(this.stackModel.get)
      return this.stackModel.get('properties');
    else
      return null;
  },*/

  /**
   * Emitted when the value is changed
   *
  valueChanged() {
    var preview = this.model.get('preview');

    if(!preview)
      return;

    if(!this.$preview)
        this.$preview = this.$el.find('#' + this.pfx + 'preview');

    var prw = '';
    var props = this.getProps();
    var previewEl = this.$preview;
    if (typeof preview === 'function') {
      preview(props, previewEl);
    } else {
      this.onPreview(props, previewEl);
    }
  },*/

  /**
   * Show inputs on this layer
   * */
  showProps() {
    this.$props = this.model.get('props');
    this.$el.find('#' + this.pfx + 'inputs').html(this.$props.show());
    this.model.set({props: null }, {silent: true });
  },


  remove(e) {
    if(e && e.stopPropagation)
      e.stopPropagation();

    Backbone.View.prototype.remove.apply(this, arguments);

    if(this.model.collection.contains(this.model))
      this.model.collection.remove(this.model);

    if(this.stackModel && this.stackModel.set){
      this.stackModel.set({stackIndex: null}, {silent: true});
      this.stackModel.trigger('updateValue');
    }
  },

  /**
   * Fetch model index
   * @return {number} Index
   *
  getIndex() {
    var index = 0;
    var model = this.model;

    if (model.collection) {
      index = model.collection.indexOf(model);
    }

    return index;
  },*/

  /**
   * Default method for changing preview box
   * @param {Collection} props
   * @param {Element} $el
   */
  onPreview(value) {
    const values = value.split(' ');
    const lim = 3;
    const result = [];
    this.model.get('properties').each((prop, index) => {
      var value = values[index] || '';

      if (value) {
        if (prop.get('type') == 'integer') {
          let valueInt = parseInt(value, 10);
          let unit = value.replace(valueInt,'');
          valueInt = !isNaN(valueInt) ? valueInt : 0;
          valueInt = valueInt > lim ? lim : valueInt;
          valueInt = valueInt < -lim ? -lim : valueInt;
          value = valueInt + unit;
        }
      }

      result.push(value);
    });

    return result.join(' ');
  },

  updatePreview() {
    const stackModel = this.stackModel;
    const customPreview = this.customPreview;
    const previewEl = this.getPreviewEl();
    const value = this.model.getFullValue();
    const preview = customPreview ? customPreview(value) : this.onPreview(value);

    if (preview && stackModel && previewEl) {
      previewEl.style[stackModel.get('property')] = preview;
    }
  },

  getPropertiesWrapper() {
    if (!this.propsWrapEl) {
      this.propsWrapEl = this.el.querySelector('[data-properties]');
    }
    return this.propsWrapEl;
  },

  getPreviewEl() {
    if (!this.previewEl) {
      this.previewEl = this.el.querySelector('[data-preview]');
    }
    return this.previewEl;
  },

  active() {
    const model = this.model;
    const collection = model.collection;
    collection.active(collection.indexOf(model));
  },

  updateVisibility() {
    const pfx = this.pfx;
    const wrapEl = this.getPropertiesWrapper();
    const active = this.model.get('active');
    wrapEl.style.display = active ? '' : 'none';
    this.$el[active ? 'addClass' : 'removeClass'](`${pfx}active`);
  },

  render() {
    const PropertiesView = require('./PropertiesView');
    const propsConfig = this.propsConfig;
    const className = `${this.pfx}layer`;
    const model = this.model;
    const el = this.el;
    const properties = new PropertiesView({
      collection: model.get('properties'),
      config: this.config,
      customValue: propsConfig.customValue,
      propTarget: propsConfig.propTarget,
      onChange: propsConfig.onChange,
    }).render().el;
    el.innerHTML = this.template(model);
    el.className = className;
    this.getPropertiesWrapper().appendChild(properties);
    this.updateVisibility();
    this.updatePreview();
    return this;
  },

});
