/**
 * Sproochentest Vocabulary Engine
 * - Firebase Auth (email/password, Google, Apple)
 * - User profile with edit name + change password
 * - Learn mode (flashcards) + Practice mode (multiple choice)
 * - Guest mode with localStorage, 10-word gate per category
 */
(function() {
  'use strict';

  // ===== CONFIG =====
  var GUEST_LIMIT = 10;
  var DECK_SIZE = 20;
  var STORAGE_KEY_PREFIX = 'sp_vocab_progress';
  var XP_CORRECT = 10;

  var FUNNY_NAMES = [
    'Gromperebierg', 'Kachkéis Kid', 'Kniddelen King', 'Bouneschlupp Boss',
    'Riesling Rider', 'Schueberfouer Star', 'Pétange Penguin', 'Musel Monkey',
    'Éisleck Eagle', 'Gromper Guru', 'Vianden Viking', 'Clervaux Cat',
    'Bettembourg Bear', 'Differdange Dragon', 'Esch Explorer', 'Dudelange Duck',
    'Mersch Moose', 'Remich Raccoon', 'Wiltz Wolf', 'Echternach Elf'
  ];

  function getRandomFunnyName() {
    return FUNNY_NAMES[Math.floor(Math.random() * FUNNY_NAMES.length)];
  }

  function getStorageKey() {
    return state.user ? STORAGE_KEY_PREFIX + '_' + state.user.uid : STORAGE_KEY_PREFIX + '_guest';
  }

  // ===== STATE =====
  var state = {
    currentView: 'categories',
    currentCategory: null,
    sessionMode: null,
    deck: [],
    deckIndex: 0,
    sessionXp: 0,
    sessionCorrect: 0,
    sessionTotal: 0,
    isAuthenticated: false,
    user: null,
    progress: { words: {}, stats: { totalXp: 0 } }
  };

  // ===== DOM REFS =====
  var els = {};

  function initDom() {
    els.categories = document.getElementById('vocab-categories');
    els.session = document.getElementById('vocab-session');
    els.complete = document.getElementById('vocab-complete');
    els.modePicker = document.getElementById('vocab-mode-picker');
    els.cardArea = document.getElementById('vocab-card-area');
    els.feedback = document.getElementById('vocab-feedback');
    els.progressText = document.getElementById('vocab-progress-text');
    els.progressFill = document.getElementById('vocab-progress-fill');
    els.sessionXp = document.getElementById('vocab-session-xp');
    els.sessionMode = document.getElementById('vocab-session-mode');
    els.backBtn = document.getElementById('vocab-back-btn');
    els.modeBackBtn = document.getElementById('vocab-mode-back-btn');
    els.continueBtn = document.getElementById('vocab-continue-btn');
    els.doneBtn = document.getElementById('vocab-done-btn');
    els.authOverlay = document.getElementById('vocab-auth-overlay');
    els.authForm = document.getElementById('vocab-auth-form');
    els.authError = document.getElementById('vocab-auth-error');
    els.authGoogle = document.getElementById('vocab-auth-google');
    els.authApple = document.getElementById('vocab-auth-apple');
    els.authLoginToggle = document.getElementById('vocab-auth-login-toggle');
    els.userBar = document.getElementById('vocab-user-bar');
    els.guestBar = document.getElementById('vocab-guest-bar');
    els.userName = document.getElementById('vocab-user-name');
    els.userAvatar = document.getElementById('vocab-user-avatar');
    els.userLevel = document.getElementById('vocab-user-level');
    els.logoutBtn = document.getElementById('vocab-logout-btn');
    els.guestSignin = document.getElementById('vocab-guest-signin');
    els.modeLearn = document.getElementById('vocab-mode-learn');
    els.modePractice = document.getElementById('vocab-mode-practice');
    els.modeTitle = document.getElementById('vocab-mode-title');
    els.profileOverlay = document.getElementById('vocab-profile-overlay');
    els.profileClose = document.getElementById('vocab-profile-close');
    els.profileForm = document.getElementById('vocab-profile-form');
    els.profilePwForm = document.getElementById('vocab-profile-password-form');
    els.profileLogout = document.getElementById('vocab-profile-logout');
  }

  // ===== FIREBASE AUTH =====
  var auth = firebase.auth();
  var db = firebase.firestore();

  function onAuthStateChanged(firebaseUser) {
    if (firebaseUser) {
      state.isAuthenticated = true;
      state.user = {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || localStorage.getItem('sp_vocab_funnyname_' + firebaseUser.uid) || (function() { var n = getRandomFunnyName(); localStorage.setItem('sp_vocab_funnyname_' + firebaseUser.uid, n); return n; })(),
        email: firebaseUser.email,
        provider: firebaseUser.providerData[0] ? firebaseUser.providerData[0].providerId : 'password'
      };
      // Load from localStorage cache first (fast)
      state.progress = loadProgressFromCache();
      updateUserUI();
      updateCategoryCards();
      // Then sync from Firestore (source of truth)
      loadProgressFromFirestore();
      // Always update displayName in Firestore on sign-in
      saveProgressToFirestore();
      // Subscribe to newsletter on first sign-in
      if (!localStorage.getItem('sp_vocab_subscribed_' + firebaseUser.uid)) {
        subscribeToNewsletter(firebaseUser.email, state.user.name);
        localStorage.setItem('sp_vocab_subscribed_' + firebaseUser.uid, '1');
      }
    } else {
      state.isAuthenticated = false;
      state.user = null;
      state.progress = loadProgressFromCache();
      updateUserUI();
      updateCategoryCards();
    }
  }

  function subscribeToNewsletter(email, name) {
    HJ.subscribe({ email: email, name: name, source: 'sproochentest' });
  }

  // ===== USER UI =====
  function updateUserUI() {
    if (state.isAuthenticated && state.user) {
      els.userBar.style.display = 'flex';
      els.guestBar.style.display = 'none';
      els.userName.textContent = state.user.name || 'User';
      els.userAvatar.textContent = (state.user.name || 'U').charAt(0).toUpperCase();
      els.userLevel.textContent = (state.progress.stats.totalXp || 0) + ' XP';
      var xpEl = document.getElementById('vocab-xp');
      var wordsEl = document.getElementById('vocab-words-learned');
      if (xpEl) xpEl.textContent = state.progress.stats.totalXp || 0;
      if (wordsEl) wordsEl.textContent = Object.keys(state.progress.words).length;
    } else {
      els.userBar.style.display = 'none';
      els.guestBar.style.display = 'flex';
    }
    updateSidebar();
  }

  // ===== SIDEBAR (Progress + Leaderboard) =====
  function updateSidebar() {
    var totalWords = 1108;
    var wordsSeen = Object.keys(state.progress.words).length;
    var pct = Math.round((wordsSeen / totalWords) * 100);
    var ringFill = document.getElementById('vocab-ring-fill');
    var ringText = document.getElementById('vocab-ring-text');
    var totalWordsSeen = document.getElementById('vocab-total-words-seen');
    var totalXpSidebar = document.getElementById('vocab-total-xp-sidebar');
    var rankEl = document.getElementById('vocab-progress-rank');
    if (ringFill) ringFill.setAttribute('stroke-dasharray', pct + ', 100');
    if (ringText) ringText.textContent = pct + '%';
    if (totalWordsSeen) totalWordsSeen.textContent = wordsSeen;
    if (totalXpSidebar) totalXpSidebar.textContent = state.progress.stats.totalXp || 0;
    // Rank text
    if (rankEl) {
      var remaining = totalWords - wordsSeen;
      if (pct >= 100) rankEl.textContent = '🏆 Master rank achieved!';
      else if (pct >= 75) rankEl.textContent = remaining + ' words to Master rank';
      else if (pct >= 50) rankEl.textContent = remaining + ' words to Expert rank';
      else if (pct >= 25) rankEl.textContent = remaining + ' words to Intermediate rank';
      else rankEl.textContent = (Math.ceil(totalWords * 0.25) - wordsSeen) + ' words to unlock Beginner rank';
    }
  }

  function loadLeaderboard() {
    var container = document.getElementById('vocab-leaderboard');
    if (!container) return;

    db.collection('vocab_progress')
      .orderBy('stats.totalXp', 'desc')
      .limit(10)
      .get()
      .then(function(snapshot) {
        if (snapshot.empty) {
          container.innerHTML = '<div class="vocab-leaderboard-loading">No learners yet. Be the first!</div>';
          return;
        }
        var html = '';
        var rank = 0;
        snapshot.forEach(function(doc) {
          rank++;
          var data = doc.data();
          var uid = doc.id;
          var xp = (data.stats && data.stats.totalXp) || 0;
          var name = data.displayName || 'Anonymous';
          var isYou = state.user && state.user.uid === uid;
          var rankClass = rank === 1 ? 'vocab-lb-rank--gold' : rank === 2 ? 'vocab-lb-rank--silver' : rank === 3 ? 'vocab-lb-rank--bronze' : '';
          var rowClass = isYou ? 'vocab-lb-row vocab-lb-row--you' : 'vocab-lb-row';

          html += '<div class="' + rowClass + '">';
          html += '<span class="vocab-lb-rank ' + rankClass + '">' + rank + '</span>';
          html += '<div class="vocab-lb-avatar">' + (name.charAt(0) || 'L').toUpperCase() + '</div>';
          html += '<span class="vocab-lb-name">' + esc(name) + (isYou ? ' (you)' : '') + '</span>';
          html += '<span class="vocab-lb-xp">' + xp + ' XP</span>';
          html += '</div>';
        });
        container.innerHTML = html;
      })
      .catch(function(err) {
        container.innerHTML = '<div class="vocab-leaderboard-loading">Unable to load leaderboard</div>';
      });
  }

  // ===== PROFILE MODAL =====
  function showProfile() {
    if (!state.user) return;
    var overlay = els.profileOverlay;
    overlay.classList.add('open');
    document.getElementById('vocab-profile-name').value = state.user.name || '';
    document.getElementById('vocab-profile-email').value = state.user.email || '';
    document.getElementById('vocab-profile-avatar').textContent = (state.user.name || 'U').charAt(0).toUpperCase();
    document.getElementById('vocab-profile-xp').textContent = state.progress.stats.totalXp || 0;
    document.getElementById('vocab-profile-words').textContent = Object.keys(state.progress.words).length;
    // Show provider
    var providerEl = document.getElementById('vocab-profile-provider');
    var providerMap = { 'google.com': 'Signed in with Google', 'apple.com': 'Signed in with Apple', 'password': 'Email & Password' };
    providerEl.textContent = providerMap[state.user.provider] || '';
    // Show/hide password section (only for email/password users)
    var pwSection = document.getElementById('vocab-profile-password-section');
    pwSection.style.display = state.user.provider === 'password' ? 'block' : 'none';
  }

  function hideProfile() {
    els.profileOverlay.classList.remove('open');
  }

  function handleProfileSave(e) {
    e.preventDefault();
    var newName = document.getElementById('vocab-profile-name').value.trim();
    if (!newName) return;
    var user = auth.currentUser;
    if (!user) return;
    var msg = document.getElementById('vocab-profile-msg');
    user.updateProfile({ displayName: newName }).then(function() {
      state.user.name = newName;
      updateUserUI();
      msg.textContent = 'Profile updated.';
      msg.className = 'vocab-profile-msg show success';
      setTimeout(function() { msg.className = 'vocab-profile-msg'; }, 3000);
    }).catch(function(err) {
      msg.textContent = err.message;
      msg.className = 'vocab-profile-msg show error';
    });
  }

  function handlePasswordChange(e) {
    e.preventDefault();
    var currentPw = document.getElementById('vocab-profile-current-pw').value;
    var newPw = document.getElementById('vocab-profile-new-pw').value;
    var msg = document.getElementById('vocab-profile-pw-msg');
    if (newPw.length < 6) {
      msg.textContent = 'New password must be at least 6 characters.';
      msg.className = 'vocab-profile-msg show error';
      return;
    }
    var user = auth.currentUser;
    if (!user) return;
    // Re-authenticate first
    var credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPw);
    user.reauthenticateWithCredential(credential).then(function() {
      return user.updatePassword(newPw);
    }).then(function() {
      msg.textContent = 'Password updated.';
      msg.className = 'vocab-profile-msg show success';
      document.getElementById('vocab-profile-current-pw').value = '';
      document.getElementById('vocab-profile-new-pw').value = '';
      setTimeout(function() { msg.className = 'vocab-profile-msg'; }, 3000);
    }).catch(function(err) {
      var errMsg = err.code === 'auth/wrong-password' ? 'Current password is incorrect.' : err.message;
      msg.textContent = errMsg;
      msg.className = 'vocab-profile-msg show error';
    });
  }

  // ===== AUTH MODAL =====
  var authMode = 'signup';

  function showAuthModal() {
    setAuthMode('signup');
    els.authOverlay.classList.add('open');
    var nameInput = document.getElementById('vocab-auth-name');
    if (nameInput) nameInput.focus();
  }

  function hideAuthModal() {
    els.authOverlay.classList.remove('open');
    els.authError.style.display = 'none';
    var btn = document.getElementById('vocab-auth-submit');
    btn.disabled = false;
    btn.textContent = authMode === 'signup' ? 'Create Account' : 'Sign In';
  }

  function setAuthMode(mode) {
    authMode = mode;
    var titleEl = document.getElementById('vocab-auth-title');
    var descEl = document.getElementById('vocab-auth-desc');
    var submitEl = document.getElementById('vocab-auth-submit');
    var nameInput = document.getElementById('vocab-auth-name');
    var toggleText = document.getElementById('vocab-auth-toggle-text');
    if (mode === 'signup') {
      titleEl.textContent = 'Create Account';
      descEl.textContent = 'Create a free account to unlock all categories, track your progress, and build your streak.';
      submitEl.textContent = 'Create Account';
      nameInput.style.display = 'block';
      nameInput.required = true;
      toggleText.innerHTML = 'Already have an account? <button type="button" id="vocab-auth-login-toggle">Sign in</button>';
    } else {
      titleEl.textContent = 'Sign In';
      descEl.textContent = 'Welcome back. Sign in to continue your progress.';
      submitEl.textContent = 'Sign In';
      nameInput.style.display = 'none';
      nameInput.required = false;
      toggleText.innerHTML = 'No account yet? <button type="button" id="vocab-auth-login-toggle">Create one</button>';
    }
    var newToggle = document.getElementById('vocab-auth-login-toggle');
    if (newToggle) {
      newToggle.addEventListener('click', function() {
        setAuthMode(authMode === 'signup' ? 'signin' : 'signup');
      });
    }
  }

  function handleAuthSubmit(e) {
    e.preventDefault();
    var email = document.getElementById('vocab-auth-email').value.trim();
    var password = document.getElementById('vocab-auth-password').value;
    var nameInput = document.getElementById('vocab-auth-name');
    var name = nameInput ? nameInput.value.trim() : '';
    if (!email) return;
    if (authMode === 'signup' && !name) {
      showAuthError('Please enter your name.');
      return;
    }
    if (password.length < 6) {
      showAuthError('Password must be at least 6 characters.');
      return;
    }
    var btn = document.getElementById('vocab-auth-submit');
    btn.disabled = true;
    btn.textContent = authMode === 'signup' ? 'Creating account...' : 'Signing in...';
    els.authError.style.display = 'none';

    if (authMode === 'signup') {
      auth.createUserWithEmailAndPassword(email, password).then(function(result) {
        return result.user.updateProfile({ displayName: name });
      }).then(function() {
        // Refresh state with updated displayName
        state.user.name = name;
        updateUserUI();
        hideAuthModal();
      }).catch(function(err) {
        showAuthError(firebaseErrorMessage(err));
        btn.disabled = false;
        btn.textContent = 'Create Account';
      });
    } else {
      auth.signInWithEmailAndPassword(email, password).then(function() {
        hideAuthModal();
      }).catch(function(err) {
        showAuthError(firebaseErrorMessage(err));
        btn.disabled = false;
        btn.textContent = 'Sign In';
      });
    }
  }

  function handleGoogleSignIn() {
    var provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).then(function() {
      hideAuthModal();
    }).catch(function(err) {
      showAuthError(firebaseErrorMessage(err));
    });
  }

  function handleAppleSignIn() {
    // Apple Sign-In removed — requires Apple Developer account setup
  }

  function handleLogout() {
    auth.signOut().then(function() {
      hideProfile();
      showView('categories');
      updateCategoryCards();
    });
  }

  function showAuthError(msg) {
    els.authError.textContent = msg;
    els.authError.style.display = 'block';
  }

  function firebaseErrorMessage(err) {
    var map = {
      'auth/email-already-in-use': 'This email is already registered. Try signing in.',
      'auth/invalid-email': 'Invalid email address.',
      'auth/weak-password': 'Password must be at least 6 characters.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/popup-closed-by-user': 'Sign-in popup was closed.',
      'auth/cancelled-popup-request': 'Sign-in cancelled.',
      'auth/invalid-credential': 'Invalid credentials. Check your email and password.'
    };
    return map[err.code] || err.message || 'Something went wrong. Try again.';
  }

  // ===== PROGRESS (Firestore + localStorage cache) =====
  // localStorage = fast cache, Firestore = source of truth for authenticated users
  // Guest users: localStorage only

  function loadProgressFromCache() {
    try {
      var key = getStorageKey();
      var data = localStorage.getItem(key);
      return data ? JSON.parse(data) : { words: {}, stats: { totalXp: 0 } };
    } catch (e) {
      return { words: {}, stats: { totalXp: 0 } };
    }
  }

  function saveProgressToCache() {
    try {
      var key = getStorageKey();
      localStorage.setItem(key, JSON.stringify(state.progress));
    } catch (e) { /* quota exceeded */ }
  }

  function loadProgressFromFirestore() {
    if (!state.user) return;
    var docRef = db.collection('vocab_progress').doc(state.user.uid);
    docRef.get().then(function(doc) {
      if (doc.exists) {
        var firestoreData = doc.data();
        if (firestoreData.words && Object.keys(firestoreData.words).length > 0) {
          state.progress = firestoreData;
          saveProgressToCache();
          updateUserUI();
          updateCategoryCards();
        } else {
          saveProgressToFirestore();
        }
      } else {
        saveProgressToFirestore();
      }
    }).catch(function(err) {
      console.warn('Firestore read failed, using cache:', err.message);
    });
  }

  function saveProgressToFirestore() {
    if (!state.user) return;
    var docRef = db.collection('vocab_progress').doc(state.user.uid);
    var payload = {
      words: state.progress.words,
      stats: state.progress.stats,
      displayName: state.user.name || 'Learner',
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    };
    docRef.set(payload, { merge: true }).catch(function(err) {
      console.warn('Firestore write failed:', err.message);
    });
  }

  var firestoreSaveTimer = null;
  function debouncedFirestoreSave() {
    if (firestoreSaveTimer) clearTimeout(firestoreSaveTimer);
    firestoreSaveTimer = setTimeout(function() {
      saveProgressToFirestore();
    }, 2000);
  }

  function saveProgress() {
    saveProgressToCache();
    if (state.isAuthenticated) {
      debouncedFirestoreSave();
    }
  }

  function getWordProgress(wordId) {
    return state.progress.words[wordId] || { box: 0, correct: 0, incorrect: 0 };
  }

  function setWordProgress(wordId, data) {
    state.progress.words[wordId] = data;
    saveProgress();
  }

  function getCategoryProgress(category) {
    var words = window.VOCAB_DATA[category] || [];
    var attempted = 0;
    for (var i = 0; i < words.length; i++) {
      if (state.progress.words[words[i].id]) attempted++;
    }
    return { total: words.length, attempted: attempted };
  }

  function getGuestWordsUsed(category) {
    var words = window.VOCAB_DATA[category] || [];
    var count = 0;
    for (var i = 0; i < words.length; i++) {
      if (state.progress.words[words[i].id]) count++;
    }
    return count;
  }

  // ===== DECK GENERATION =====
  function generateDeck(category) {
    var allWords = window.VOCAB_DATA[category] || [];
    if (!allWords.length) return [];
    var limit = state.isAuthenticated ? DECK_SIZE : Math.min(GUEST_LIMIT, allWords.length);
    if (!state.isAuthenticated && getGuestWordsUsed(category) >= GUEST_LIMIT) {
      showAuthModal();
      return [];
    }
    var shuffled = allWords.slice().sort(function() { return Math.random() - 0.5; });
    if (state.sessionMode === 'practice') {
      shuffled.sort(function(a, b) {
        var pa = getWordProgress(a.id);
        var pb = getWordProgress(b.id);
        if (pa.box === 0 && pb.box !== 0) return -1;
        if (pb.box === 0 && pa.box !== 0) return 1;
        return pa.box - pb.box;
      });
    }
    return shuffled.slice(0, limit);
  }

  // ===== DISTRACTOR GENERATION =====
  function getDistractors(correctWord, category, count) {
    var allWords = window.VOCAB_DATA[category] || [];
    var distractors = [];
    var used = {};
    used[correctWord.en] = true;
    var samePosWords = allWords.filter(function(w) {
      return w.pos === correctWord.pos && w.id !== correctWord.id;
    });
    var pool = samePosWords.length >= count ? samePosWords : allWords.filter(function(w) {
      return w.id !== correctWord.id;
    });
    if (pool.length < count) {
      var allCategories = Object.keys(window.VOCAB_DATA);
      for (var c = 0; c < allCategories.length; c++) {
        if (allCategories[c] === category) continue;
        var catWords = window.VOCAB_DATA[allCategories[c]];
        for (var w = 0; w < catWords.length; w++) {
          if (!used[catWords[w].en]) pool.push(catWords[w]);
        }
      }
    }
    pool.sort(function() { return Math.random() - 0.5; });
    for (var i = 0; i < pool.length && distractors.length < count; i++) {
      if (!used[pool[i].en]) {
        distractors.push(pool[i].en);
        used[pool[i].en] = true;
      }
    }
    return distractors;
  }

  // ===== VIEW MANAGEMENT =====
  function showView(view) {
    state.currentView = view;
    els.categories.style.display = view === 'categories' ? 'block' : 'none';
    els.session.style.display = view === 'session' ? 'block' : 'none';
    els.complete.style.display = view === 'complete' ? 'flex' : 'none';
    els.modePicker.style.display = view === 'mode' ? 'block' : 'none';
  }

  function updateCategoryCards() {
    var bars = document.querySelectorAll('.vocab-card-bar');
    for (var i = 0; i < bars.length; i++) {
      var cat = bars[i].getAttribute('data-category');
      var prog = getCategoryProgress(cat);
      var pct = prog.total > 0 ? Math.round((prog.attempted / prog.total) * 100) : 0;
      bars[i].style.width = pct + '%';
      // Add status classes to parent card
      var card = bars[i].closest('.vocab-card');
      if (card) {
        card.classList.remove('vocab-card--started', 'vocab-card--mastered');
        if (pct >= 100) card.classList.add('vocab-card--mastered');
        else if (pct > 0) card.classList.add('vocab-card--started');
      }
    }
  }

  function handleCategoryClick(e) {
    var card = e.target.closest('.vocab-card');
    if (!card) return;
    state.currentCategory = card.getAttribute('data-category');
    showModePicker(state.currentCategory);
  }

  function showModePicker(category) {
    var card = document.querySelector('[data-category="' + category + '"] .vocab-card-title');
    els.modeTitle.textContent = card ? card.textContent : category;
    showView('mode');
  }

  // ===== SESSION =====
  function startSession(category, mode) {
    state.currentCategory = category;
    state.sessionMode = mode;
    state.deck = generateDeck(category);
    if (!state.deck.length) return;
    state.deckIndex = 0;
    state.sessionXp = 0;
    state.sessionCorrect = 0;
    state.sessionTotal = state.deck.length;
    els.sessionMode.textContent = mode === 'learn' ? 'LEARN' : 'PRACTICE';
    showView('session');
    updateSessionUI();
    showCard();
  }

  function updateSessionUI() {
    els.progressText.textContent = (state.deckIndex + 1) + ' / ' + state.sessionTotal;
    var pct = state.sessionTotal > 0 ? Math.round((state.deckIndex / state.sessionTotal) * 100) : 0;
    els.progressFill.style.width = pct + '%';
    els.sessionXp.textContent = '+' + state.sessionXp + ' XP';
  }

  function showCard() {
    if (state.deckIndex >= state.deck.length) { completeSession(); return; }
    els.feedback.style.display = 'none';
    els.feedback.className = 'vocab-feedback';
    preloadDeckAudio();
    if (state.sessionMode === 'learn') showLearnCard();
    else showPracticeCard();
  }

  function nextCard() {
    state.deckIndex++;
    updateSessionUI();
    showCard();
  }

  // ===== AUDIO PLAYBACK (with preload cache) =====
  var audioCache = {};

  function preloadAudio(word) {
    var path = getAudioPath(word);
    if (!audioCache[path]) {
      var audio = new Audio();
      audio.preload = 'auto';
      audio.src = path;
      audioCache[path] = audio;
    }
  }

  function preloadDeckAudio() {
    // Preload current card + next 5 cards
    for (var i = state.deckIndex; i < Math.min(state.deckIndex + 6, state.deck.length); i++) {
      preloadAudio(state.deck[i]);
    }
  }

  function getAudioPath(word) {
    // Derive category from word id prefix (e.g. "essential_001" → "essential-words")
    var prefix = word.id.split('_')[0];
    var categoryMap = {
      'essential': 'essential-words', 'articles': 'articles-pronouns', 'starter-verbs': 'starter-verbs',
      'intro': 'introductions', 'numbers': 'numbers-dates', 'fillers': 'fillers-connectors',
      'questions': 'question-words', 'locators': 'locators', 'objects': 'describe-objects',
      'people': 'describe-people', 'adj': 'adjective-declension', 'prep': 'prepositions',
      'sport': 'sport', 'wunnen': 'wunnen', 'transport': 'transport', 'hobbyen': 'hobbyen',
      'vakanz': 'vakanz', 'gesond': 'gesondheet', 'medien': 'medien-technologien',
      'sproochen': 'sproochen', 'kaddoen': 'kaddoen', 'summer': 'summer-wanter',
      'aarbecht': 'aarbecht', 'stot': 'stot-maachen', 'family': 'family',
      'freq': 'frequent-verbs', 'irreg': 'irregular-verbs', 'past': 'simple-past', 'lux': 'truly-luxembourgish'
    };
    var category = categoryMap[prefix] || prefix;
    return '/assets/audio/vocab/' + category + '/' + word.id + '.m4a';
  }

  function getAudioButton(word) {
    var path = getAudioPath(word);
    // Check if audio file exists by trying to load it
    return '<button class="vocab-audio-btn" data-audio="' + path + '" aria-label="Play pronunciation" title="Listen" style="display:none;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg></button>';
  }

  // Show audio button only if file exists
  function checkAudioExists(btn) {
    var path = btn.getAttribute('data-audio');
    var audio = audioCache[path];
    if (audio && audio.readyState >= 2) {
      btn.style.display = '';
      return;
    }
    var test = new Audio();
    test.preload = 'metadata';
    test.src = path;
    test.onloadedmetadata = function() {
      btn.style.display = '';
      audioCache[path] = test;
    };
    test.onerror = function() {
      btn.style.display = 'none';
    };
  }

  function playAudio(path) {
    var audio = audioCache[path];
    if (!audio) {
      audio = new Audio(path);
      audioCache[path] = audio;
    }
    audio.currentTime = 0;
    audio.play().catch(function() { /* file may not exist yet */ });
  }

  // Delegate audio button clicks
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('.vocab-audio-btn');
    if (btn) {
      var path = btn.getAttribute('data-audio');
      if (path) playAudio(path);
    }
  });

  // ===== LEARN MODE =====
  function showLearnCard() {
    var word = state.deck[state.deckIndex];
    var html = '<div class="vocab-flashcard">';
    html += '<div class="vocab-word-row"><div class="vocab-question-word">' + esc(word.lb) + '</div>' + getAudioButton(word) + '</div>';
    var meta = [];
    if (word.pos) meta.push(word.pos);
    if (word.gender) { var gm = {m:'masculine',f:'feminine',n:'neutral'}; meta.push(gm[word.gender]||''); }
    if (word.plural) meta.push('pl. ' + word.plural);
    if (meta.length) html += '<div class="vocab-flashcard-meta">' + esc(meta.join(' · ')) + '</div>';
    html += '<div class="vocab-flashcard-divider"></div>';
    html += '<div class="vocab-flashcard-translation">' + esc(word.en) + '</div>';
    html += '<div class="vocab-flashcard-details">';
    if (word.example_lb) html += '<div class="vocab-flashcard-example">"' + esc(word.example_lb) + '"</div>';
    if (word.example_en) html += '<div class="vocab-flashcard-extra">' + esc(word.example_en) + '</div>';
    if (word.conjugation) html += '<div class="vocab-flashcard-extra">' + esc(word.conjugation) + '</div>';
    if (word.usage_note) html += '<div class="vocab-flashcard-extra">💡 ' + esc(word.usage_note) + '</div>';
    html += '</div>';
    html += '<div class="vocab-flashcard-actions">';
    html += '<button class="vocab-flashcard-btn vocab-flashcard-btn--know" id="vocab-learn-know">I know this ✓</button>';
    html += '<button class="vocab-flashcard-btn vocab-flashcard-btn--next" id="vocab-learn-next">Next →</button>';
    html += '</div></div>';
    els.cardArea.innerHTML = html;
    // Show audio button only if file exists
    var audioBtn = els.cardArea.querySelector('.vocab-audio-btn');
    if (audioBtn) checkAudioExists(audioBtn);
    // Mark as seen
    var wp = getWordProgress(word.id);
    if (!wp.box) { wp.box = 1; wp.correct = 0; wp.incorrect = 0; }
    setWordProgress(word.id, wp);
    document.getElementById('vocab-learn-know').addEventListener('click', function() {
      var wp2 = getWordProgress(word.id);
      wp2.box = Math.min((wp2.box || 1) + 1, 5);
      wp2.correct = (wp2.correct || 0) + 1;
      setWordProgress(word.id, wp2);
      state.sessionCorrect++;
      state.sessionXp += 5;
      showXpFloat(this, '+5 XP');
      nextCard();
    });
    document.getElementById('vocab-learn-next').addEventListener('click', nextCard);
  }

  // ===== PRACTICE MODE =====
  function showPracticeCard() {
    var word = state.deck[state.deckIndex];
    var distractors = getDistractors(word, state.currentCategory, 3);
    var options = distractors.concat([word.en]).sort(function() { return Math.random() - 0.5; });
    var hint = word.pos;
    if (word.pos === 'noun' && word.gender) { var gm2 = {m:'masculine',f:'feminine',n:'neutral'}; hint = gm2[word.gender] || hint; }
    var html = '<div class="vocab-word-row"><div class="vocab-question-word">' + esc(word.lb) + '</div>' + getAudioButton(word) + '</div>';
    html += '<div class="vocab-question-hint">' + esc(hint) + '</div>';
    html += '<div class="vocab-options" role="radiogroup" aria-label="Choose the correct translation">';
    for (var i = 0; i < options.length; i++) {
      html += '<button class="vocab-option" role="radio" aria-checked="false" data-answer="' + esc(options[i]) + '">' + esc(options[i]) + '</button>';
    }
    html += '</div>';
    els.cardArea.innerHTML = html;
    var audioBtn2 = els.cardArea.querySelector('.vocab-audio-btn');
    if (audioBtn2) checkAudioExists(audioBtn2);
    var btns = els.cardArea.querySelectorAll('.vocab-option');
    for (var j = 0; j < btns.length; j++) btns[j].addEventListener('click', handleAnswer);
  }

  function handleAnswer(e) {
    var selected = e.target.getAttribute('data-answer');
    var word = state.deck[state.deckIndex];
    var isCorrect = selected === word.en;
    var btns = els.cardArea.querySelectorAll('.vocab-option');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.add('vocab-option--disabled');
      if (btns[i].getAttribute('data-answer') === word.en) btns[i].classList.add('vocab-option--correct');
      if (!isCorrect && btns[i].getAttribute('data-answer') === selected) btns[i].classList.add('vocab-option--wrong');
    }
    var wp = getWordProgress(word.id);
    if (isCorrect) {
      state.sessionCorrect++;
      state.sessionXp += XP_CORRECT;
      wp.box = Math.min((wp.box || 0) + 1, 5);
      wp.correct = (wp.correct || 0) + 1;
      showXpFloat(e.target, '+' + XP_CORRECT + ' XP');
    } else {
      wp.box = 1;
      wp.incorrect = (wp.incorrect || 0) + 1;
      state.deck.push(word);
      state.sessionTotal = state.deck.length;
    }
    setWordProgress(word.id, wp);
    if (!state.isAuthenticated) {
      var used = getGuestWordsUsed(state.currentCategory);
      if (used >= GUEST_LIMIT && state.deckIndex < state.deck.length - 1) {
        showFeedback(isCorrect, word);
        setTimeout(function() { showAuthModal(); }, 1200);
        return;
      }
    }
    showFeedback(isCorrect, word);
  }

  function showFeedback(isCorrect, word) {
    var icon = isCorrect ? '✓' : '✗';
    var text = isCorrect ? 'Correct!' : 'The answer is: ' + word.en;
    var cls = isCorrect ? 'vocab-feedback--correct' : 'vocab-feedback--wrong';
    var html = '<div class="vocab-feedback-icon">' + icon + '</div>';
    html += '<div class="vocab-feedback-text">' + esc(text) + '</div>';
    if (word.example_lb) html += '<div class="vocab-feedback-example">' + esc(word.example_lb) + ' — ' + esc(word.example_en || '') + '</div>';
    html += '<button class="vocab-next-btn" id="vocab-next-card">Next →</button>';
    els.feedback.innerHTML = html;
    els.feedback.className = 'vocab-feedback ' + cls;
    els.feedback.style.display = 'block';
    document.getElementById('vocab-next-card').addEventListener('click', nextCard);
  }

  function completeSession() {
    state.progress.stats.totalXp = (state.progress.stats.totalXp || 0) + state.sessionXp;
    saveProgress();
    // Force immediate Firestore write on session complete
    if (state.isAuthenticated) {
      if (firestoreSaveTimer) clearTimeout(firestoreSaveTimer);
      saveProgressToFirestore();
    }
    document.getElementById('complete-correct').textContent = state.sessionCorrect;
    document.getElementById('complete-total').textContent = state.deckIndex;
    document.getElementById('complete-xp').textContent = state.sessionXp;
    showView('complete');
    updateCategoryCards();
    updateUserUI();
    loadLeaderboard();
  }

  function showXpFloat(target, text) {
    var rect = target.getBoundingClientRect();
    var el = document.createElement('div');
    el.className = 'vocab-xp-float';
    el.textContent = text;
    el.style.left = rect.left + rect.width / 2 - 30 + 'px';
    el.style.top = rect.top - 10 + 'px';
    document.body.appendChild(el);
    setTimeout(function() { el.remove(); }, 800);
  }

  function esc(str) {
    if (!str) return '';
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // ===== INIT =====
  function init() {
    initDom();

    // Firebase auth state listener
    auth.onAuthStateChanged(onAuthStateChanged);

    updateCategoryCards();
    loadLeaderboard();

    // Category clicks
    var grids = document.querySelectorAll('.vocab-grid');
    for (var g = 0; g < grids.length; g++) {
      grids[g].addEventListener('click', handleCategoryClick);
    }

    // Mode picker
    if (els.modeLearn) els.modeLearn.addEventListener('click', function() { startSession(state.currentCategory, 'learn'); });
    if (els.modePractice) els.modePractice.addEventListener('click', function() { startSession(state.currentCategory, 'practice'); });

    // Back buttons
    if (els.backBtn) els.backBtn.addEventListener('click', function() { showView('categories'); updateCategoryCards(); updateUserUI(); });
    if (els.modeBackBtn) els.modeBackBtn.addEventListener('click', function() { showView('categories'); });

    // Complete view
    if (els.continueBtn) els.continueBtn.addEventListener('click', function() { startSession(state.currentCategory, state.sessionMode); });
    if (els.doneBtn) els.doneBtn.addEventListener('click', function() { showView('categories'); updateCategoryCards(); updateUserUI(); });

    // Auth modal
    if (els.authForm) els.authForm.addEventListener('submit', handleAuthSubmit);
    if (els.authGoogle) els.authGoogle.addEventListener('click', handleGoogleSignIn);
    if (els.authApple) els.authApple.addEventListener('click', handleAppleSignIn);
    if (els.authOverlay) els.authOverlay.addEventListener('click', function(e) { if (e.target === els.authOverlay) hideAuthModal(); });
    if (els.authLoginToggle) els.authLoginToggle.addEventListener('click', function() { setAuthMode(authMode === 'signup' ? 'signin' : 'signup'); });
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape') { hideAuthModal(); hideProfile(); } });

    // Guest sign-in
    if (els.guestSignin) els.guestSignin.addEventListener('click', showAuthModal);

    // Logout (from user bar)
    if (els.logoutBtn) els.logoutBtn.addEventListener('click', handleLogout);

    // Profile: click username to open
    if (els.userName) els.userName.addEventListener('click', showProfile);
    if (els.userAvatar) document.getElementById('vocab-user-avatar').addEventListener('click', showProfile);

    // Profile modal
    if (els.profileClose) els.profileClose.addEventListener('click', hideProfile);
    if (els.profileOverlay) els.profileOverlay.addEventListener('click', function(e) { if (e.target === els.profileOverlay) hideProfile(); });
    if (els.profileForm) els.profileForm.addEventListener('submit', handleProfileSave);
    if (els.profilePwForm) els.profilePwForm.addEventListener('submit', handlePasswordChange);
    if (els.profileLogout) els.profileLogout.addEventListener('click', handleLogout);
  }

  // Boot
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
