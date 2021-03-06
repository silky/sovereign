//Makes tags in contract draggable
Template.semantics.rendered = function () {

  if (!Session.get('contract')) { return };

  if (Session.get('contract').stage == STAGE_DRAFT) {

    this.$('#tagSuggestions, #tagList').sortable({
        stop: function(e, ui) {
          Session.set('removeTag', false);
        },
        start: function (event, ui) {
          ui.helper.width(ui.helper.width() + 3);
          ui.placeholder.width(ui.item.width());
          if (this.id == "tagList") {
            Session.set('removeTag', true);
          }
        },
        receive: function (event, ui) {
          if (this.id == 'tagSuggestions') {
            if (Session.get('removeTag')) {
              removeTag(ui.item.get(0).getAttribute('value'));
              ui.item.get(0).remove();
              Session.set('removeTag', false);
            }
            Session.set('maxReached', false);
            Session.set('duplicateTags', false);
          } else if (this.id == 'tagList') {
            if(addTag(ui.item.get(0).getAttribute('value'), ui.item.index()) == true) {
              var element = ui.item.get(0).childNodes[1].childNodes[6];
              element.parentNode.removeChild(element);
              ui.item.get(0).remove();
            } else {
              ui.item.get(0).remove();
            }
          }
        },
        revert: 100,
        cancel: '.nondraggable',
        connectWith: ".connectedSortable",
        forceHelperSize: true,
        helper: 'clone',
        zIndex: 9999,
        placeholder: 'tag tag-placeholder'
    });
    TagSearch.search('');

  }

  Session.set('dbTagList', Contracts.findOne( { _id: Session.get('contract')._id }, {reactive: false}).tags );

};

Template.semantics.helpers({
  emptyTags: function () {
    if (Session.get('contract').stage != STAGE_DRAFT && Session.get('contract').tags.length == 0) {
      return true;
    }
    return false;
  },
  semantics: function () {
    return sortRanks(Session.get('dbTagList'));
  },
  getTags: function() {
    var search = TagSearch.getData({
      transform: function(matchText, regExp) {
        return matchText.replace(regExp, "<b>$&</b>")
      },
      sort: {isoScore: -1}
    });
    if (!(Session.get('createTag') || Session.get('searchBox')) || search.length == 0) {
      return Tags.find({}).fetch().slice(0, 50);
    } else {
      return search;
    }
  },
  createTag: function () {
    return displayElement('createTag');
  },
  removeTag: function () {
    return displayElement('removeTag');
  },
  emptyDb: function () {
    if (displayElement('createTag') == '') {
      return 'display:none';
    } else {
      if (TagSearch.getData({}).length > 0 || Tags.find({}).fetch().length > 0) {
        return 'display:none';
      } else {
        return '';
      }
    }
  },
  newTag: function () {
    return Session.get('newTag');
  },
  emptyList: function () {
    if (Session.get('dbTagList') != undefined) {
      if (Session.get('dbTagList').length <= 0) {
        Session.set('noTags', true);
        return 'height:0;';
      } else {
        Session.set('noTags', false);
        return 'display:none';
      }
    }
  },
  searchBox: function () {
    if (Session.get('searchBox')) {
      return 'search-active';
    } else {
      return '';
    }
  },
  noTags: function () {
    return Session.get('noTags');
  },
  unauthorizedTags: function() {
    return Session.get('unauthorizedTags');
  },
  maxReached: function () {
    return displayTimedWarning('maxReached');
  },
  minTags: function () {
    return displayTimedWarning('minTags');
  },
  duplicateTags: function() {
    return displayTimedWarning('duplicateTags');
  },
  voteKeyword: function () {
    return Session.get('voteKeyword');
  },
  sample: function () {
    return Session.get('searchSample');
  },
  alreadyVoted: function () {
    return Session.get('alreadyVoted');
  },
  rightToVote: function () {
    return Session.get('rightToVote');
  }
});

Template.semantics.events({
  "keypress #tagSearch": function (event) {
    if (Session.get('createTag') && event.which == 13) {
      addCustomTag(document.getElementById("tagSearch").innerHTML.replace(/&nbsp;/gi,''));
      resetTagSearch();
      document.getElementById("tagSearch").innerHTML = '';
    }
    Session.set('searchBox', true);
    return event.which != 13;
  },
  "input #tagSearch": function (event) {
    var content = document.getElementById("tagSearch").innerHTML.replace(/&nbsp;/gi,'');
    TagSearch.search(content);

    if (TagSearch.getData().length == 0 && content != '') {
      Session.set('createTag', true);
      Session.set('newTag', content);
    } else {
      Session.set('createTag', false);
    }
  },
  "focus #tagSearch": function (event) {
    document.getElementById("tagSearch").innerHTML = '';
  },
  "blur #tagSearch": function (event) {
    //if (Session.get('createTag') == false) {
      resetTagSearch();
    //}
    Session.set('searchBox', false);
  },
  "click #add-custom-tag": function (event) {
    event.preventDefault();
    addCustomTag(document.getElementById("tagSearch").innerHTML.replace(/&nbsp;/gi,''));
    Meteor.setTimeout(function () {
      resetTagSearch();
    }, 100);
  }
});
