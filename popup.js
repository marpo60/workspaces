document.addEventListener('DOMContentLoaded', function() {
  document.getElementById("save").addEventListener("click", save);
  document.getElementById("clean").addEventListener("click", clean);
  chrome.storage.onChanged.addListener(populateWorkspaces);

  populateWorkspaces();
});

function save() {
  chrome.tabs.query({ currentWindow: true }, function(tabs){
    var name = document.getElementById("name").value;
    var item = {};

    item[name] = tabs.map(function(tab) { return tab.url; });
    chrome.storage.local.set(item);
  });
}

function clean() {
  chrome.storage.local.clear();
}

function openWorkspace(e) {
  var key = e.target.innerText;
  chrome.storage.local.get(key, function(items) {
    chrome.windows.create({ url: items[key] });
  });
}

function populateWorkspaces() {
  var workspaces = document.getElementById("workspaces")
  workspaces.innerHTML = "";

  chrome.storage.local.get(null, function(items) {
    var keys = Object.keys(items);
    keys.forEach(function(key){
      var workspace = document.createElement("li");
      workspace.appendChild(document.createTextNode(key));
      workspace.addEventListener("click", openWorkspace);

      workspaces.appendChild(workspace);
    });
  });
}
