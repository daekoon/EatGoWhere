// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// jQuery for form submission
$("#comment-form").submit(function(event) {
  event.preventDefault();
  var postUrl = "/comments";
  var formData = $(this).serialize();
  this.reset();
  $.post(postUrl, formData, function() {
    loadComments();
  });
});

function openPage(element, page_name) {
  // Hide all elements with class="page-content" by default */
  var i, page, button;
  page = document.getElementsByClassName("page-content");
  for (i = 0; i < page.length; i++) {
    page[i].style.display = "none";
  }

  button = document.getElementsByClassName("nav-button");
  // Make all buttons default
  for (i = 0; i < button.length; i++) {
    button[i].className = "nav-button";
  }

  // Make current page's description button active
  console.log(element)
  element.parentElement.className += " nav-button_active";

  // Show the specific tab content
  document.getElementById(page_name).style.display = "block";
}

function loadComments() {
  fetch('/comments').then(response => response.json()).then(
    data => {
      showComments(data);
    });
}

function arrayToListElement(array) {
  const ulElement = document.createElement('ul');
  for (node of array) {
    const liElement = document.createElement('li');
    liElement.innerText = node.message;
    ulElement.appendChild(liElement);
  }

  return ulElement;
}

function showComments(data) {
  commentContainer = document.getElementById('comments-list');
  // prevents duplicate comment elements
  if (commentContainer.hasChildNodes()) {
    // only removes first node as currently there is only the comments node
    commentContainer.removeChild(commentContainer.childNodes[0]);
  }
  commentContainer.appendChild(arrayToListElement(data));
}
