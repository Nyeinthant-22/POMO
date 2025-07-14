// Get DOM elements
        const timerDisplay = document.getElementById('timer-display');
        const focusTimerDisplay = document.getElementById('focus-timer-display');
        const timerLabel = document.getElementById('timer-label');
        const timerSubtitle = document.getElementById('timer-subtitle');
        const startBtn = document.getElementById('start-btn');
        const stopBtn = document.getElementById('stop-btn');
        const resetBtn = document.getElementById('reset-btn');
        const themeToggleBtn = document.getElementById('theme-toggle');
        const themeToggleIcon = themeToggleBtn.querySelector('i');
        const settingsBtn = document.getElementById('settings-btn');
        const focusModeBtn = document.getElementById('focus-mode-btn');
        const topBar = document.getElementById('top-bar');
        const mainTimerSection = document.getElementById('main-timer-section');
        const focusModeOverlay = document.getElementById('focus-mode-overlay');
        const focusStopBtn = document.getElementById('focus-stop-btn');
        const endFocusLink = document.getElementById('end-focus-link');
        const ringtone = document.getElementById('ringtone');
        const popupOverlay = document.getElementById('popup-overlay');
        const popupCloseBtn = document.getElementById('popup-close-btn');

        // Settings modal elements
        const settingsModalOverlay = document.getElementById('settings-modal-overlay');
        const pomodoroMinutesInput = document.getElementById('pomodoro-minutes-input');
        const saveSettingsBtn = document.getElementById('save-settings-btn');
        const cancelSettingsBtn = document.getElementById('cancel-settings-btn');

        // Music elements
        const musicVolumeSlider = document.getElementById('music-volume-slider');
        const musicSelect = document.getElementById('music-select');

        // Removed Mute Background Music during Timer elements

        // Audio elements for each song
        const audioTracks = {
            'music-1': document.getElementById('music-1'),
            'music-2': document.getElementById('music-2'),
            'music-3': document.getElementById('music-3')
        };
        let currentAudioTrackId = 'music-1'; // Default selected song
        let currentAudioElement = audioTracks[currentAudioTrackId]; // Reference to the currently active audio element

        // Timer variables
        let minutes = 25;
        let seconds = 0;
        let intervalId = null;
        let isRunning = false;
        let hasInteracted = false; // Flag to track user interaction for audio autoplay
        let defaultPomodoroMinutes = 25;
        // Removed isBackgroundMusicMutedDuringTimer and wasMusicPlayingBeforeTimer

        /**
         * Shows a modal overlay with a smooth transition.
         * @param {HTMLElement} overlayElement - The modal overlay element.
         */
        function showModal(overlayElement) {
            if (overlayElement) {
                overlayElement.style.display = 'flex'; // Make it visible for layout
                // Use a timeout to allow display:flex to apply before adding class for transition
                setTimeout(() => {
                    overlayElement.classList.add('visible');
                }, 10);
            } else {
                console.error("Error: Modal overlay element not found when trying to show modal.");
            }
        }

        /**
         * Hides a modal overlay with a smooth transition.
         * @param {HTMLElement} overlayElement - The modal overlay element.
         */
        function hideModal(overlayElement) {
            if (overlayElement) {
                overlayElement.classList.remove('visible');
                // Use a timeout to allow transition to complete before hiding
                setTimeout(() => {
                    overlayElement.style.display = 'none';
                }, 300); // Match CSS transition duration
            } else {
                console.error("Error: Modal overlay element not found when trying to hide modal.");
            }
        }


        /**
         * Updates the timer display with the current minutes and seconds.
         * Formats seconds to always have two digits (e.g., 05 instead of 5).
         */
        function updateTimerDisplay() {
            const formattedMinutes = String(minutes).padStart(2, '0');
            const formattedSeconds = String(seconds).padStart(2, '0');
            timerDisplay.textContent = `${formattedMinutes}:${formattedSeconds}`;
            focusTimerDisplay.textContent = `${formattedMinutes}:${formattedSeconds}`;
        }

        /**
         * Shows the pop-up message.
         */
        function showPopup() {
            showModal(popupOverlay);
        }

        /**
         * Hides the pop-up message.
         */
        function hidePopup() {
            hideModal(popupOverlay);
        }

        /**
         * Shows the settings modal.
         * Populates the input field with the current default Pomodoro minutes.
         */
        function showSettingsModal() {
            if (settingsModalOverlay) {
                pomodoroMinutesInput.value = defaultPomodoroMinutes; // Set current value
                musicSelect.value = currentAudioTrackId;
                // Removed muteBgMusicOnTimerToggle.checked assignment
                showModal(settingsModalOverlay);
            } else {
                console.error("Error: settingsModalOverlay element not found.");
            }
        }

        /**
         * Hides the settings modal.
         */
        function hideSettingsModal() {
            hideModal(settingsModalOverlay);
        }

        /**
         * Loads the default Pomodoro time and music settings from local storage.
         */
        function loadSettings() {
            const savedMinutes = localStorage.getItem('defaultPomodoroMinutes');
            if (savedMinutes) {
                defaultPomodoroMinutes = parseInt(savedMinutes, 10);
            } else {
                defaultPomodoroMinutes = 25; // Default value
            }
            minutes = defaultPomodoroMinutes; // Apply to current timer
            updateTimerDisplay(); // Update display with loaded time

            // Load music volume setting
            const savedVolume = localStorage.getItem('backgroundMusicVolume');
            if (savedVolume !== null) {
                musicVolumeSlider.value = parseFloat(savedVolume);
                Object.values(audioTracks).forEach(audio => {
                    audio.volume = parseFloat(savedVolume);
                });
            } else {
                Object.values(audioTracks).forEach(audio => {
                    audio.volume = 0.5; // Default volume
                });
            }

            // Load selected music track
            const savedMusicTrackId = localStorage.getItem('selectedBackgroundMusic');
            if (savedMusicTrackId) { // Check if savedMusicTrackId exists
                currentAudioTrackId = savedMusicTrackId;
                // If "no-sound" was saved, ensure currentAudioElement is null or handled
                if (currentAudioTrackId !== 'no-sound' && audioTracks[currentAudioTrackId]) {
                    currentAudioElement = audioTracks[currentAudioTrackId];
                } else {
                    currentAudioElement = null; // No active audio element for "no-sound"
                }
            } else {
                currentAudioTrackId = 'music-1'; // Default to first song
                currentAudioElement = audioTracks['music-1'];
            }
            musicSelect.value = currentAudioTrackId;

            // Load music playback state
            const savedMusicState = localStorage.getItem('backgroundMusicPlaying');
            // Only try to play if a sound track is selected and it was playing
            if (savedMusicState === 'true' && currentAudioTrackId !== 'no-sound') {
                playBackgroundMusic();
            }

            // Removed load for isBackgroundMusicMutedDuringTimer
        }

        /**
         * Saves the adjusted Pomodoro time and music settings to local storage.
         */
        function saveSettings() {
            const newMinutes = parseInt(pomodoroMinutesInput.value, 10);
            if (isNaN(newMinutes) || newMinutes <= 0 || newMinutes > 120) {
                console.error("Please enter a valid number of minutes (1-120).");
                return;
            }
            defaultPomodoroMinutes = newMinutes;
            localStorage.setItem('defaultPomodoroMinutes', defaultPomodoroMinutes);

            currentAudioTrackId = musicSelect.value;
            localStorage.setItem('selectedBackgroundMusic', currentAudioTrackId);
            switchAudioTrack(currentAudioTrackId); // Switch to the new track if different

            localStorage.setItem('backgroundMusicVolume', musicVolumeSlider.value);

            // Removed save for isBackgroundMusicMutedDuringTimer

            resetTimer(); // Apply new time and reset
            hideSettingsModal();
        }

        /**
         * Plays the background music.
         */
        function playBackgroundMusic() {
            // Only play if a valid audio track is selected
            if (currentAudioTrackId === 'no-sound' || !currentAudioElement) {
                console.log("No sound selected or audio element not found. Not playing background music.");
                return;
            }

            // Attempt to play a muted sound on first interaction to unlock audio playback
            if (!hasInteracted) {
                const tempAudio = new Audio(); // Create a temporary audio element
                tempAudio.muted = true;
                tempAudio.play().then(() => {
                    console.log("Temporary audio playback unlocked.");
                    tempAudio.pause();
                    tempAudio.currentTime = 0;
                }).catch(error => {
                    console.warn("Temporary autoplay unlock failed:", error);
                });
                hasInteracted = true;
            }

            // Only play if currently paused
            if (currentAudioElement.paused) {
                currentAudioElement.muted = false; // Ensure not muted
                currentAudioElement.volume = musicVolumeSlider.value; // Set volume from slider
                currentAudioElement.play().then(() => {
                    console.log("Background music playing:", currentAudioTrackId);
                    localStorage.setItem('backgroundMusicPlaying', 'true');
                }).catch(error => {
                    console.error("Error playing background music:", error);
                });
            } else if (!currentAudioElement.paused) {
                console.log("Background music is already playing.");
            }
        }

        /**
         * Pauses the background music.
         */
        function pauseBackgroundMusic() {
            // Only pause if there's an active audio element and it's playing
            if (currentAudioElement && !currentAudioElement.paused) {
                currentAudioElement.pause();
                console.log("Background music paused:", currentAudioTrackId);
                localStorage.setItem('backgroundMusicPlaying', 'false');
            } else if (currentAudioElement && currentAudioElement.paused) {
                console.log("Background music is already paused.");
            }
        }

        /**
         * Updates the background music volume based on the slider.
         */
        function updateMusicVolume() {
            if (currentAudioElement) { // Only update if an audio element is active
                currentAudioElement.volume = musicVolumeSlider.value;
                localStorage.setItem('backgroundMusicVolume', musicVolumeSlider.value);
            }
        }

        /**
         * Switches the active background audio track.
         * Pauses the currently playing track and plays the new one if it was playing.
         * @param {string} newTrackId - The ID of the new audio track to switch to.
         */
        function switchAudioTrack(newTrackId) {
            const wasPlaying = currentAudioElement ? !currentAudioElement.paused : false; // Check if current track was playing

            // Pause the old track if it exists
            if (currentAudioElement) {
                currentAudioElement.pause();
                currentAudioElement.currentTime = 0; // Reset its time
            }

            // Set the new current audio element based on selection
            if (newTrackId === 'no-sound') {
                currentAudioElement = null; // No active audio element
                localStorage.setItem('backgroundMusicPlaying', 'false'); // Ensure state is false
                console.log("Background music set to No Sound.");
            } else if (audioTracks[newTrackId]) {
                currentAudioTrackId = newTrackId;
                currentAudioElement = audioTracks[newTrackId];
                // If the previous track was playing, start the new one
                if (wasPlaying) {
                    playBackgroundMusic();
                }
            } else {
                console.warn("Invalid music track ID selected:", newTrackId);
                currentAudioElement = null;
                localStorage.setItem('backgroundMusicPlaying', 'false');
            }
        }

        /**
         * Starts the Pomodoro timer.
         * Sets the subtitle to "Running..." and begins the countdown.
         * Handles timer completion.
         */
        function startTimer() {
            if (isRunning) return; // Prevent multiple intervals

            // Always play background music if a track is selected (no mute during timer option)
            if (currentAudioTrackId !== 'no-sound') {
                playBackgroundMusic();
            }

            isRunning = true;
            timerSubtitle.textContent = "Running...";
            intervalId = setInterval(() => {
                if (seconds === 0) {
                    if (minutes === 0) {
                        // Timer finished
                        clearInterval(intervalId);
                        isRunning = false;
                        timerSubtitle.textContent = "Time's Up!";

                        console.log(`Timer finished at ${minutes}:${seconds}. Showing popup.`);
                        showPopup();
                        
                        // Play ringtone
                        ringtone.muted = false;
                        ringtone.volume = 1;
                        console.log("Attempting to play ringtone. Current readyState:", ringtone.readyState, "Muted:", ringtone.muted, "Volume:", ringtone.volume);

                        if (ringtone.readyState >= 2) {
                            try {
                                ringtone.play();
                                console.error("Ringtone playing.");
                            } catch (error) {
                                console.error("Error playing ringtone at 00:00:", error);
                                timerSubtitle.textContent = "Pomodoro session complete! (Sound blocked)";
                            }
                        } else {
                            console.warn("Ringtone not ready to play. Current readyState:", ringtone.readyState);
                            timerSubtitle.textContent = "Pomodoro session complete! (Sound not loaded)";
                        }

                        // Always pause background music if a track is selected (no mute during timer option)
                        if (currentAudioTrackId !== 'no-sound') {
                            pauseBackgroundMusic();
                        }

                        timerSubtitle.textContent = "Pomodoro session complete! Take a break.";
                        return;
                    }
                    minutes--;
                    seconds = 59;
                } else {
                    seconds--;
                }
                updateTimerDisplay();
            }, 1000);
        }

        /**
         * Stops the Pomodoro timer.
         * Clears the interval and sets the subtitle to "Paused".
         */
        function stopTimer() { 
            clearInterval(intervalId);
            isRunning = false;
            timerSubtitle.textContent = "Paused";
            ringtone.pause(); // Pause the ringtone if it's playing
            ringtone.currentTime = 0; // Reset ringtone to the beginning
            
            // Always pause background music if a track is selected (no mute during timer option)
            if (currentAudioTrackId !== 'no-sound') {
                pauseBackgroundMusic();
            }
        }

        /**
         * Resets the Pomodoro timer to its initial state (defaultPomodoroMinutes:00).
         * Stops any running timer and updates the display and subtitle.
         */
        function resetTimer() {
            stopTimer(); // This will handle pausing background music if needed
            minutes = defaultPomodoroMinutes; // Use the default set by user
            seconds = 0;
            updateTimerDisplay();
            timerSubtitle.textContent = "Ready";
        }

        /**
         * Loads the theme preference from localStorage.
         * Applies the 'ocean-theme' class to the body if saved,
         * and updates the theme toggle icon accordingly.
         */
        function loadTheme() {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'ocean') {
                document.body.classList.add('ocean-theme');
                themeToggleIcon.classList.remove('fa-sun');
                themeToggleIcon.classList.add('fa-moon');
            } else {
                document.body.classList.remove('ocean-theme');
                localStorage.setItem('theme', 'white');
                themeToggleIcon.classList.remove('fa-moon');
                themeToggleIcon.classList.add('fa-sun');
            }
        }

        /**
         * Toggles between the 'white' and 'ocean' themes.
         * Saves the new theme preference to localStorage and updates the icon.
         */
        function toggleTheme() {
            if (document.body.classList.contains('ocean-theme')) {
                document.body.classList.remove('ocean-theme');
                localStorage.setItem('theme', 'white');
                themeToggleIcon.classList.remove('fa-moon');
                themeToggleIcon.classList.add('fa-sun');
            } else {
                document.body.classList.add('ocean-theme');
                localStorage.setItem('theme', 'ocean');
                themeToggleIcon.classList.remove('fa-sun');
                themeToggleIcon.classList.add('fa-moon');
            }
        }

        /**
         * Enters Focus Mode.
         * Hides the top bar and main timer controls,
         * and shows the full-screen focus mode overlay.
         */
        function enterFocusMode() {
            topBar.classList.add('hidden');
            mainTimerSection.classList.add('hidden');
            focusModeOverlay.classList.remove('hidden');
            // Ensure focus timer display is updated immediately
            updateTimerDisplay();
        }

        /**
         * Exits Focus Mode.
         * Shows the top bar and main timer controls,
         * and hides the full-screen focus mode overlay.
         */
        function exitFocusMode() {
            topBar.classList.remove('hidden');
            mainTimerSection.classList.remove('hidden');
            focusModeOverlay.classList.add('hidden');
        }

        // Event Listeners
        startBtn.addEventListener('click', startTimer);
        stopBtn.addEventListener('click', stopTimer);
        resetBtn.addEventListener('click', resetTimer);
        themeToggleBtn.addEventListener('click', toggleTheme);
        settingsBtn.addEventListener('click', showSettingsModal);
        saveSettingsBtn.addEventListener('click', saveSettings);
        cancelSettingsBtn.addEventListener('click', hideSettingsModal);
        focusModeBtn.addEventListener('click', enterFocusMode);
        focusStopBtn.addEventListener('click', () => {
            stopTimer();
            exitFocusMode();
        });
        endFocusLink.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            exitFocusMode();
        });

        // Music controls event listeners (playMusicBtn and pauseMusicBtn removed)
        musicVolumeSlider.addEventListener('input', updateMusicVolume);

        musicSelect.addEventListener('change', (event) => {
            const newTrackId = event.target.value;
            switchAudioTrack(newTrackId);
        });

        // Removed Event listener for mute background music during timer toggle

        if (popupCloseBtn) {
            popupCloseBtn.addEventListener('click', hidePopup);
        } else {
            console.error("Error: popupCloseBtn element not found. Cannot attach event listener.");
        }

        // Initialize on page load
        document.addEventListener('DOMContentLoaded', () => {
            loadTheme();
            loadSettings(); // Load all settings, including new mute background music option
            updateTimerDisplay();
            timerSubtitle.textContent = "Ready"; // Initial state

            // Register Service Worker for offline capability
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/service-worker.js')
                        .then(registration => {
                            console.log('Service Worker registered with scope:', registration.scope);
                        })
                        .catch(error => {
                            console.error('Service Worker registration failed:', error);
                        });
                });
            }
        });