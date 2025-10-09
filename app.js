// ============================================
// CONFIGURATION - IMPORTANT: UPDATE THIS!
// ============================================
// Replace with your Google Apps Script URL from Step 1.4
const API_URL = 'https://script.google.com/macros/s/AKfycbwQ71xBKA_pRBd0YLpIYxRjT8BGvyblDG0eNQN0vanFyNXYJmk_88QDY5xBVRCCrMZ_/exec';

// Local storage key for tracking votes
const VOTE_KEY = 'hasVoted';
const USER_ID_KEY = 'userId';

// Chart instance (global)
let chart = null;

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('App initialized');
    
    // Check if user has already voted
    if (hasUserVoted()) {
        console.log('User has already voted, showing results');
        showResults();
    }
    
    // Attach form submit handler
    document.getElementById('voteForm').addEventListener('submit', handleVote);
    
    console.log('Event listeners attached');
});

// ============================================
// VOTE TRACKING FUNCTIONS
// ============================================

// Check if user has voted
function hasUserVoted() {
    return localStorage.getItem(VOTE_KEY) === 'true';
}

// Mark user as having voted
function markAsVoted() {
    localStorage.setItem(VOTE_KEY, 'true');
}

// Generate or retrieve user ID
function generateUserId() {
    let userId = localStorage.getItem(USER_ID_KEY);
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem(USER_ID_KEY, userId);
    }
    return userId;
}

// ============================================
// VOTE SUBMISSION
// ============================================

async function handleVote(e) {
    e.preventDefault();
    
    console.log('Form submitted');
    
    // Double-check if already voted
    if (hasUserVoted()) {
        alert('You have already voted!');
        showResults();
        return;
    }
    
    // Get selected choice
    const formData = new FormData(e.target);
    const choice = formData.get('vote');
    
    if (!choice) {
        alert('Please select an option');
        return;
    }
    
    console.log('Selected choice:', choice);
    
    // Update button state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;
    
    try {
        // Prepare vote data
        const voteData = {
            questionId: 'q1',
            choice: choice,
            userId: generateUserId()
        };
        
        console.log('Sending vote data:', voteData);
        
        // Submit to Google Sheets via Apps Script
        await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors', // Required for Google Apps Script
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(voteData)
        });
        
        console.log('Vote submitted successfully');
        
        // Mark as voted
        markAsVoted();
        
        // Show success message
        alert('✅ Thank you! Your vote has been recorded.');
        
        // Show results
        showResults();
        
    } catch (error) {
        console.error('Error submitting vote:', error);
        alert('❌ Error submitting vote. Please try again.');
        
        // Restore button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// ============================================
// VIEW MANAGEMENT
// ============================================

// Show survey section
function showSurvey() {
    console.log('Showing survey section');
    document.getElementById('surveySection').classList.remove('hidden');
    document.getElementById('resultsSection').classList.add('hidden');
}

// Show results section
async function showResults() {
    console.log('Showing results section');
    document.getElementById('surveySection').classList.add('hidden');
    document.getElementById('resultsSection').classList.remove('hidden');
    
    // Load and display results
    await loadResults();
}

// ============================================
// RESULTS LOADING & DISPLAY
// ============================================

async function loadResults() {
    console.log('Loading results from API...');
    
    try {
        // Fetch results from Google Sheets
        const response = await fetch(API_URL + '?t=' + Date.now()); // Cache buster
        
        if (!response.ok) {
            throw new Error('Failed to fetch results');
        }
        
        const votes = await response.json();
        console.log('Received votes:', votes);
        
        // Check if we have any votes
        if (Object.keys(votes).length === 0) {
            document.getElementById('voteCount').textContent = 'No votes yet. Be the first to vote!';
            return;
        }
        
        // Calculate total votes
        const totalVotes = Object.values(votes).reduce((sum, count) => sum + count, 0);
        console.log('Total votes:', totalVotes);
        
        // Update vote count display
        document.getElementById('voteCount').textContent = `Total Votes: ${totalVotes}`;
        
        // Display chart
        displayChart(votes);
        
    } catch (error) {
        console.error('Error loading results:', error);
        document.getElementById('voteCount').textContent = 
            'Error loading results. Please refresh the page.';
    }
}

// ============================================
// CHART RENDERING
// ============================================

function displayChart(votes) {
    console.log('Displaying chart with data:', votes);
    
    const ctx = document.getElementById('resultsChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (chart) {
        chart.destroy();
    }
    
    // Prepare data for chart
    const labels = Object.keys(votes);
    const data = Object.values(votes);
    
    // Color palette
    const colors = [
        '#89CFF0',
        '#FFEC8B',
        '#FFB6C1',
        '#4BC0C0',
        '#9966FF',
        '#FF9F40'
    ];
    
    // Create pie chart
    chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} votes (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
    
    console.log('Chart rendered successfully');
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Optional: Reset vote (for testing)
function resetVote() {
    localStorage.removeItem(VOTE_KEY);
    console.log('Vote reset');
    location.reload();
}

// Expose reset function to console for testing
window.resetVote = resetVote;
