"use strict";

var $ = require('jquery'),
    _ = require('underscore'),
    Backbone = require('backbone'),
    models = require('../models'),
    camelize = require('underscore.string/camelize'),
    alert_template = require('../templates/alert.ejs');

module.exports = Backbone.View.extend({
  events: {
    'click a': 'handleLink',
    'submit form': 'handleForm',
    'click button[data-action]': 'handleAction',
    'change select[data-auto-submit=true]': 'submitForm'
  },

  initialize: function() {
    var args = Array.prototype.slice.call(arguments);
    this.hook('beforeInit', args);

    if(_.isObject(this.collection)) {
      this.collection
        .on("sync sort", this.render, this)
        .on("error", this.logError, this);
    }

    if(_.isObject(this.model)) {
      this.model
        .on("sync change", this.render, this)
        .on("error", this.logError, this);
    }

    if(_.isObject(args[0]['query'])) { this.query = args[0].query; }

    this.render();

    this.hook('afterInit', args);
  },

  handleLink: function(eve) {
    var href = $(eve.currentTarget).attr('href');
    if (!/https?:\/\//.test(href)) {
      eve.preventDefault();
      eve.stopPropagation();
      Backbone.history.navigate(
        $(eve.currentTarget).attr('href'),
        {trigger: true});
    }
  },

  handleForm: function(eve) {
    eve.preventDefault();
    eve.stopPropagation();

    var inst, Model,
        $form = $(eve.currentTarget),
        fields = this._formData(eve.currentTarget),
        model_class = $form.data('model'),
        model_id = $form.data('model-id'),
        action = $form.data('action'),
        next = $form.data('next');

    if(model_class && action === 'new') {
      Model = models[model_class];
      this.hook('beforeSubmit', $form, fields, action, Model);
      inst = new Model();
    } else if(_.isObject(this.model) && action === 'edit') {
      this.hook('beforeSubmit', $form, fields, action, this.model);
      inst = this.model;
    } else if ($form.attr('method').toLowerCase() === 'get') {
      // if the method attr is `get` then we can navigate to that new
      // url and avoid any posting
      var basepath = $form.attr('action') || window.location.pathname;
      Backbone.history.navigate(
        basepath + '?' + $form.serialize(),
        {trigger: true});
      return;
    } else { throw "Don't know how to handle this form"; }

    inst.set(fields);
    if(!inst.isValid()) { return this.render(); }

    inst.save()
      .done(_.bind(function() {
        if(action === 'new') {
          this.success('New '+model_class+' saved');
        } else {
          this.success(model_class+' updates saved');
        }
        if(next){
          Backbone.history.navigate(next, {trigger: true});
        } else {
          if(_.isObject(this.collection)) {
            this.collection.fetch();
          } else if(_.isObject(this.model)) {
            this.model.fetch();
          }
        }
      }, this))
      .fail(_.bind(this.handleRequestError, this));
  },

  handleAction: function(eve) {
    eve.preventDefault();
    eve.stopPropagation();
    var $btn = $(eve.currentTarget),
        action = $btn.data('action');
    this.hook(camelize('handle-' + action + '-action'), eve);
  },

  handleDeleteAction: function(eve) {
    var inst,
        $btn = $(eve.currentTarget),
        model_class = $btn.data('model'),
        model_id = $btn.data('model-id'),
        next = $btn.data('next');

    if(window.confirm('Are you sure you want to delete this?')) {
      inst = new models[model_class]({id: model_id});
      inst.destroy()
        .done(_.bind(function() {
          this.success('Deleted '+model_class);
          if(_.isObject(this.model)) {
            Backbone.history.navigate(this.model.urlRoot, {trigger: true});
          } else {
            this.collection.fetch();
          }
        }, this))
        .fail(_.bind(this.handleRequestError, this));
    }
  },

  handleRequestError: function(xhr, status, error){
    if(error === 'Bad Request') {
      var data = $.parseJSON(xhr.responseText);
      this.error(data.error);
    } else {
      this.error('Something bad happened... Please reload and try again');
    }
    console.log("REQUEST FAILED!!");
    console.log(xhr, status, error);
  },

  submitForm: function(eve) {
    $(eve.currentTarget).parents('form').submit();
  },

  render: function() {
    var obj = {};
    if(_.isObject(this.collection)) { obj.collection = this.collection; }
    else if(_.isObject(this.model)) { obj.model = this.model; }

    if(_.isObject(this.query)) { obj.query = this.query; }

    this.hook('beforeRender', obj);

    this.$el.html(this.template(obj));

    this.hook('afterRender', obj);

    return this;
  },

  logError: function(model_or_collection, resp, options) {
    console.log(arguments);
  },

  error: function(message) {
    this.alert(message, 'danger');
  },

  success: function(message) {
    this.alert(message, 'success');
  },

  alert: function(message) {
    var level = arguments[1] || 'info';
    $('#flash').html(alert_template({ level: level, message: message }));
  },

  hook: function() {
    var args = Array.prototype.slice.call(arguments),
        name = args.shift();
    console.log('hook ' + name);
    if(_.isFunction(this[name])) { return this[name].apply(this, args); }
    this.trigger(name, args);
  },

  _modelOrCollection: function() {
    if(_.isObject(this.collection)) { return this.collection; }
    else if(_.isObject(this.model)) { return this.model; }
  },

  _formData: function(ele) {
    var fields = {};
    _.each(
      $(ele).find(":input").serializeArray(),
      function(i) { fields[i.name] = i.value; }
    );
    return fields;
  }
});

