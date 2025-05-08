// Constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const IMAGE_LOAD_TIMEOUT = 30000; // 30 seconds
const MAX_IMAGES = 50;

// State management
const state = {
  selectedImages: [],
  isProcessing: false,
  remainingFiles: 5,
  maxDimension: 2000,
  quality: 0.8
};

// DOM Elements
const elements = {
  dropZone: document.getElementById('dropZone'),
  imageInput: document.getElementById('imageInput'),
  previewContainer: document.getElementById('preview'),
  convertBtn: document.getElementById('convertBtn'),
  downloadBtn: document.getElementById('downloadBtn'),
  remainingFilesElement: document.getElementById('remainingFiles')
};

// Utility functions
function cleanupResources(canvas, img) {
  if (canvas) {
    canvas.width = 1;
    canvas.height = 1;
    canvas = null;
  }
  if (img) {
    img.src = '';
    img = null;
  }
}

function updateUIState() {
  const hasImages = state.selectedImages.length > 0;
  elements.downloadBtn.style.display = hasImages ? 'inline-block' : 'none';
  elements.convertBtn.disabled = !hasImages || state.isProcessing;
  if (!hasImages) {
    window.generatedPDF = null;
  }
}

function setLoading(isLoading) {
  state.isProcessing = isLoading;
  if (isLoading) {
    elements.convertBtn.classList.add('loading');
    elements.convertBtn.disabled = true;
  } else {
    elements.convertBtn.classList.remove('loading');
    elements.convertBtn.disabled = false;
  }
}

function validateFile(file) {
  if (!file || file.size === 0) {
    return { valid: false, error: 'Empty file' };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Unsupported file type' };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File too large' };
  }
  if (state.selectedImages.length >= MAX_IMAGES) {
    return { valid: false, error: 'Maximum number of images reached' };
  }
  return { valid: true };
}

// Toast notification system
function showToast(message, type = 'info') {
  const existingToasts = document.querySelectorAll('.toast');
  existingToasts.forEach(toast => toast.remove());

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  const icon = document.createElement('i');
  icon.className = getToastIcon(type);
  icon.style.marginRight = '8px';
  toast.insertBefore(icon, toast.firstChild);
  
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function getToastIcon(type) {
  const icons = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    warning: 'fas fa-exclamation-triangle',
    info: 'fas fa-info-circle'
  };
  return icons[type] || icons.info;
}

// Drag and drop handling
function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

function highlight() {
  elements.dropZone.classList.add('drag-over');
}

function unhighlight() {
  elements.dropZone.classList.remove('drag-over');
}

// File handling
async function handleFiles(files) {
  if (state.remainingFiles <= 0) {
    showToast('Please upgrade to Pro for unlimited conversions', 'warning');
    return;
  }

  const loadingToast = document.createElement('div');
  loadingToast.className = 'toast progress';
  loadingToast.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing files...';
  document.body.appendChild(loadingToast);
  requestAnimationFrame(() => loadingToast.classList.add('show'));

  try {
    const fileArray = Array.from(files);
    let processedCount = 0;

    for (const file of fileArray) {
      const validation = validateFile(file);
      if (!validation.valid) {
        showToast(`${validation.error}: ${file.name}`, 'error');
        continue;
      }

      const result = await processFile(file);
      if (result.success) {
        processedCount++;
        updateRemainingFiles();
      }
      
      loadingToast.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Processing file ${processedCount} of ${fileArray.length}...`;
    }

    updateUIState();
  } catch (error) {
    console.error('Error processing files:', error);
    showToast('Error processing files. Please try again.', 'error');
  } finally {
    loadingToast.classList.remove('show');
    setTimeout(() => loadingToast.remove(), 300);
  }
}

async function processFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    let canvas = null;
    let img = null;

    reader.onload = (e) => {
      img = new Image();
      img.onload = () => {
        try {
          canvas = doc
