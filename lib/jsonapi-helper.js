(function () {
  function isEmptyObject (obj) {
    var key;
    for (key in obj) {
      return false;
    }
    return true;
  }

  /**
   * check: http://stackoverflow.com/questions/5735483/regex-to-get-first-word-after-slash-in-url
   */
  function splitURL (url) {
    return url.split(/^(([^:\/?#]+):)?(\/\/([^\/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/);
  }

  /**
   * Create a simple Object wrapper to plain JSONAPI resource
   *
   * @param {String} baseUri
   * @param {Object} jsonapiObject;
   */
  function JSONAPIHelper(jsonapiObject, baseUri) {
    this._jsonapiObject = jsonapiObject;
    this._baseUri = baseUri;

    this._mainKey = this._getMainKey();
    this._mainObject = this._jsonapiObject[this._mainKey];
    this._type = this._mainObject instanceof Array ? 'collection' : 'item';
    this._links = this._jsonapiObject.links;
    this._linked = this._jsonapiObject.linked;
    this._linksKeys = this._getLinksKeys();
  }

  JSONAPIHelper.prototype = {
    constructor: JSONAPIHelper
  };

  /**
   * Get the top-level main key of JSONAPI object.
   *
   * Check http://jsonapi.org/format/#document-structure-top-level for jsonapi
   * format details.
   */
  JSONAPIHelper.prototype._getMainKey = function () {
    var mainKey;

    for (key in this._jsonapiObject) {
      switch (key) {
      case 'links':
      case 'linked':
      case 'meta':
        break;
      default:
        mainKey = key;
      }
    }

    return mainKey;
  };


  /**
   * Get the links key for top-level JSONAPI resource object.
   *
   * Check http://jsonapi.org/format/#document-structure-top-level for jsonapi
   * format details.
   */
  JSONAPIHelper.prototype._getLinksKeys = function () {
    var key;

    if (this._links === undefined) {
      return [];
    }
    else {
      var linksKeys = [];

      for (key in this._links) {
        linksKeys.push(key.split('.')[1]);
      }

      return linksKeys;
    }
  };


  /**
   * Whirlwind tour to get `meta` info for `links` keys.
   */
  JSONAPIHelper.prototype._getMetaForLinksKey = function (key) {
    var attrib = this._links[this._mainKey + '.' + key];
    var path;
    var meta = {};

    meta.linksKey = this._mainKey + '.' + key;

    if ((typeof attrib) === 'string') {
      path = splitURL(attrib);
      meta.type = path[5].split('/')[1];
      meta.href = attrib;
    }
    else if (!(attrib instanceof Array) && ((typeof attrib) === 'object')) {
      if (attrib.type === undefined) {
        path = splitURL(attrib.href);
        meta.type = path[5].split('/')[1];
        meta.href = attrib.href;
      }
      else {
        meta.type = attrib.type;
        meta.href = attrib.href;
      }
    }
    else {
      return undefined;
    }

    return meta;
  };

  /**
   * Get data from `linked` field.
   */
  JSONAPIHelper.prototype._getLinkedDataByIds = function (key, ids) {
    var i, j;
    var data;
    var meta;
    var collection;

    if (this._linked != undefined) {
      meta = this._getMetaForLinksKey(key);
      collection = this._linked[meta.type];
    }
    else {
      return undefined;
    }

    if ((typeof ids) === 'string') {
      data = {};                  // for single id, returns an object
      for (i = 0; i < collection.length; i++) {
        if (collection[i].id === ids) {
          data = collection[i];
        }
      }
    }
    else if (ids instanceof Array) {
      data = [];             // for an array of ids, returns an array of objects.
      for (i = 0; i < ids.length; i++) {
        for (j = 0; j < collection.length; j++) {
          if (collection[j].id === ids[i]) {
            data.push(collection[j]);
          }
        }
      }
    }
    else {
      return undefined;
    }

    return data;
  };

  /**
   * Get data for `links` via HTTP request
   */
  JSONAPIHelper.prototype._getLinksDataByIds = function (key, ids) {
    // do not support this feature yet
  };

  JSONAPIHelper.prototype._getDataByIds = function (key, ids) {
    if (this._linked != undefined) { // inline expand
      return this._getLinkedDataByIds(key, ids);
    }
    else {                        // do not support yet, just a placeholder.
      return this._getLinksDataByIds(key, ids);
    }
  };

  /**
   * expand JSONAPI resouce to embedded object.
   *
   * This operation is **idempotent**.
   */
  JSONAPIHelper.prototype.expand = function () {
    var i, j;
    var key, ids;
    var mainExpandedObject;

    if (this._expandedObject === undefined) {
      this._expandedObject = JSON.parse(JSON.stringify(this._jsonapiObject));
    }
    else {                        // object has been expanded already.
      return this._expandedObject;
    }

    mainExpandedObject = this._expandedObject[this._mainKey];


    if (this._mainObject === [] ||          // empty collection
        isEmptyObject(this._mainObject) ||  // empty object
        this._links === undefined) {        // no `links` property
      // do nothing
    }
    else {                        // it has `links` property
      if (this._type === 'collection') {
        for (i = 0; i < mainExpandedObject.length; i++) {
          for (j = 0; j < this._linksKeys.length; j++) {
            key = this._linksKeys[j];
            ids = mainExpandedObject[i]['links'][key];
            mainExpandedObject[i][key] = this._getLinkedDataByIds(key, ids);
          }
        }
      }
      else {
        for (i = 0; i < this._linksKeys.length; i++) {
          key = this._linksKeys[i];
          ids = mainExpandedObject['links'][key];
          mainExpandedObject[key] = this._getLinkedDataByIds(key, ids);
        }
      }
    }

    // delete unnecessary properties in this._expandedObject
    delete this._expandedObject.links;
    delete this._expandedObject.linked;
    delete this._expandedObject.meta;

    if (this._type === 'collection') {
      for (i = 0; i < mainExpandedObject.length; i++) {
        delete mainExpandedObject[i].links;
      }
    }
    else {
      delete mainExpandedObject.links;
    }

    return this._expandedObject;
  };

  var isNode    = typeof require === 'function' && typeof exports === 'object';
  var isBrowser = typeof window === 'object';

  if (isNode) {
    module.exports = JSONAPIHelper;
  }
  else if (isBrowser) {
    window.JSONAPIHelper = JSONAPIHelper;
  }
}).call();
