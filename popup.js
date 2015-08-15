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

  // TODO: We can return a promise of this action
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

Workspace.open = function(name) {
  chrome.storage.local.get(name, function(bucket) {
    chrome.windows.create({ url: bucket[name] });
  });
};

Workspace.destroyAll = function() {
  chrome.storage.local.clear();
};

Workspace.createFromCurrentWindow = function(name) {
  chrome.tabs.query({ currentWindow: true }, function(tabs){
    var urlList = tabs.map(function(tab) { return tab.url; }),
        workspace = new Workspace(name, urlList);

    workspace.save();
  });
};

Workspace.onChange = function(callback) {
  chrome.storage.onChanged.addListener(callback);
};

/**
 * Builds a HTML list of workspaces
 *
 * @constructor
 */
function HtmlBuilder() {
  this.workspaces = [];
}

HtmlBuilder.prototype.buildWorkspace = function(workspace) {
  this.workspaces.push(workspace);
};

HtmlBuilder.prototype.toHtml = function() {
  var container = document.createElement("ul"),
      node;

  this.workspaces.forEach(function(workspace) {
      node = document.createElement("li");
      node.workspaceName = workspace.name;
      node.appendChild(document.createTextNode(workspace.name));
      node.appendChild(document.createTextNode(" [" + workspace.numberOfItems()  + "]"));
      container.appendChild(node);
  });

  return container;
};

/**
 * Application
 */
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById("save").addEventListener("click", save);
  document.getElementById("clean").addEventListener("click", Workspace.destroyAll);
  document.getElementById("workspaces").addEventListener("click", openWorkspace);

  Workspace.onChange(populateWorkspaces);

  populateWorkspaces();
});

function save() {
  var name = document.getElementById("name").value;

  document.getElementById("name").value = "";
  Workspace.createFromCurrentWindow(name);
}

function openWorkspace(e) {
  var key = e.target.workspaceName;

  // if the target of the click is not a workspace element just ignore the
  // click
  if (!key) {
    return;
  }

  Workspace.open(key);
}

function populateWorkspaces() {
  Workspace.all().then(function(workspaces) {
    var builder = new HtmlBuilder(),
        container = document.getElementById("workspaces");

    workspaces.forEach(function(workspace) {
      builder.buildWorkspace(workspace);
    });

    container.innerHTML = "";
    container.appendChild(builder.toHtml());
  });
}
