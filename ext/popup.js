'use strict';

(() => {

/**
 * Represents a group of URLs grouped by a name
 *
 * @constructor
 * @this {Workspace}
 * @param {string} name The name of the workspace
 * @param {Object[]} tabs - The list of tabs associated to the workspace
 * @param {string} employee.title - The title of the tab
 * @param {string} employee.url - The tab url
 * @param {string} employee.active - Indicate if the tab is active or not
 * @param {boolean} employee.pinned - The tab pinned state
 * @param {string} employee.favIconUrl - The tab favicon url
 */
function Workspace(name, tabList) {
  this.name = name;
  this.tabList = tabList;
  this.getActiveTab = () => {
    return this.tabList.find((tab) => {
      return tab.active;
    });
  };
}

Workspace.prototype.numberOfItems = function() {
  return this.tabList.length;
};

Workspace.prototype.save = function() {
  var bucket = {};

  bucket[this.name] = this.tabList;

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

Workspace.open = function(workspace, target) {
  chrome.storage.local.get(workspace.name, function(bucket) {
    chrome.windows.create(function(newWindow) {
      let isFirstTabLoad = false;

      bucket[workspace.name].forEach((tabInfo) => {
        chrome.tabs.create({
          windowId: newWindow.id,
          url: tabInfo.url,
          pinned: tabInfo.pinned,
          active: tabInfo.active
        });

        if (!isFirstTabLoad) {
          // Remove default tab
          chrome.tabs.remove(newWindow.tabs[0].id);
          isFirstTabLoad = true;
        }
      });
    });
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
    var tabList = tabs.map(function({ url, pinned, title, active, favIconUrl }) {
      return {
        url, pinned, title, active, favIconUrl
      };
    });

    var workspace = new Workspace(name, tabList);

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
      textCount = document.createElement("span"),
      button = document.createElement("button"),
      icon = document.createElement("img");

  text.appendChild(document.createTextNode(workspace.name));
  textCount.appendChild(document.createTextNode(`[${workspace.numberOfItems()} tabs]`));
  textCount.classList.add('tab-count');

  button.appendChild(document.createTextNode("X"));

  icon.classList.add("favicon");
  icon.src = workspace.getActiveTab().favIconUrl;

  icon.onerror = () => {
    icon.src = 'icon.png';
  }

  box.appendChild(icon);
  box.appendChild(text);
  box.appendChild(textCount);
  box.appendChild(button);

  button.addEventListener("click", function(e) {
    Workspace.destroy(workspace.name);
    e.stopPropagation();
  });

  box.addEventListener("click", function() {
    Workspace.open(workspace, this);
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
