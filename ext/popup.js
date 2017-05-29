'use strict';

(() => {

/**
 * Represents a group of URLs grouped by a name
 *
 * @constructor
 * @this {Workspace}
 * @param {string} name The name of the workspace
 * @param {string[]} urlList The list of URLs associated to the workspace
 */
function Workspace(name, urlList) {
  this.name = name;
  this.urlList = urlList;
}

Workspace.prototype.numberOfItems = function() {
  return this.urlList.length;
};

Workspace.prototype.save = function() {
  var bucket = {};

  bucket[this.name] = this.urlList;

  // We can return a promise of this action
  chrome.storage.local.set(bucket);
};

Workspace.mapLocalStorageItemsToWorkspaces = function(items) {
  var keys = Object.keys(items);

  return keys.map(function(key) {
    return new Workspace(key, items[key]);
  });
};

Workspace.all = function() {
  return new Promise(function(resolve) {
    chrome.storage.local.get(null, resolve);
  }).then(this.mapLocalStorageItemsToWorkspaces);
};

Workspace.open = function(workspace) {
  chrome.storage.local.get(workspace.name, function(bucket) {
    chrome.windows.create({ url: bucket[workspace.name] });
  });
};

Workspace.destroyAll = function() {
  chrome.storage.local.clear();
};

Workspace.destroy = function(name) {
  chrome.storage.local.remove(name);
};

Workspace.createFromCurrentWindow = function(name) {
  chrome.tabs.query({ currentWindow: true }, function(tabs){
    var urlList = tabs.map(function(tab) {return tab.url;}),
        workspace = new Workspace(name, urlList);

    workspace.save();
  });
};

Workspace.onChange = function(callback) {
  chrome.storage.onChanged.addListener(callback);
};

function HtmlBuilder(container) {
  this.container = container;
  this.node = document.createElement("ul");
}

HtmlBuilder.prototype.buildWorkspace = function(workspace) {
  var box = document.createElement("li"),
      text = document.createElement("span"),
      button = document.createElement("button");

  text.appendChild(document.createTextNode(workspace.name));
  text.appendChild(document.createTextNode(`[${workspace.numberOfItems()}]`));

  button.appendChild(document.createTextNode("X"));
  box.appendChild(text);
  box.appendChild(button);

  button.addEventListener("click", function(e) {
    Workspace.destroy(workspace.name);

    e.stopPropagation();
  });

  box.addEventListener("click", function() {
    Workspace.open(workspace);
  });

  this.node.appendChild(box);
};

HtmlBuilder.prototype.buildEmptyState = function() {
  this.node = document.createTextNode(
    "To create a new workspace just write the name of the workspace on the input and hit enter!");
};

HtmlBuilder.prototype.done = function() {
  this.container.innerHTML = "";
  this.container.appendChild(this.node);
};

/**
 * Application
 */
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById("save").addEventListener("submit", save);
  document.getElementById("clean").addEventListener("click", Workspace.destroyAll);

  Workspace.onChange(populateWorkspaces);

  populateWorkspaces();
});

function save(event) {
  event.preventDefault();

  var name = document.getElementById("name").value;

  document.getElementById("name").value = "";
  Workspace.createFromCurrentWindow(name);
}

function populateWorkspaces() {
  Workspace.all().then(function(workspaces) {
    var builder = new HtmlBuilder(document.getElementById("workspaces"));

    if (workspaces.length) {
      workspaces.forEach(function(workspace) {
        builder.buildWorkspace(workspace);
      });
    } else {
      builder.buildEmptyState();
    }

    builder.done();
  });
}
})();
