let totalScore = 0;
const scoreDisplay = document.getElementById("score");

let taskFollow = false;
let taskLike = false;
let taskQuote = false;
let taskTag = false;

window.onload = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get("referral");
  if (refCode) {
    const refInput = document.getElementById("referral");
    if (refInput) refInput.value = refCode;
  }

  if (typeof loggedInUser !== "undefined" && loggedInUser && loggedInUser !== null) {
    showSuccessData(loggedInUser, true);
  }
};

function switchAuth(mode) {
  const flowReg = document.getElementById("flow-register");
  const flowLog = document.getElementById("flow-login");
  const tabReg = document.getElementById("tab-reg");
  const tabLog = document.getElementById("tab-log");

  const errorLogin = document.getElementById("error-login");
  if (errorLogin) errorLogin.style.display = "none";

  if (mode === "register") {
    flowReg.classList.remove("hidden");
    flowLog.classList.add("hidden");
    tabReg.classList.add("active");
    tabLog.classList.remove("active");
  } else {
    flowReg.classList.add("hidden");
    flowLog.classList.remove("hidden");
    tabReg.classList.remove("active");
    tabLog.classList.add("active");
  }
}

function processLogin() {
  const wallet = document.getElementById("login-wallet").value.trim();
  const errorMsg = document.getElementById("error-login");
  const btn = document.getElementById("login-btn");

  if (!wallet.startsWith("0x") || wallet.length !== 42) {
    errorMsg.innerText = "Please enter a valid 42-character wallet address.";
    errorMsg.style.display = "block";
    return;
  }

  errorMsg.style.display = "none";
  btn.innerText = "Searching...";
  btn.disabled = true;

  fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress: wallet }),
  })
    .then(async (response) => {
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Wallet not found. Please register first.");
        }
        throw new Error(
          data.message || data.error || "Login failed. Please try again.",
        );
      }
      return data;
    })
    .then((data) => {
      if (data.success) {
        showSuccessData(data.user, true);
      } else {
        throw new Error("Wallet not found. Please register first.");
      }
    })
    .catch((error) => {
      console.error("Login Error:", error);
      errorMsg.innerText = error.message || "Network error. Try again.";
      errorMsg.style.display = "block";
      btn.innerText = "Access Pass";
      btn.disabled = false;
    });
}

function markTask(task) {
  if (task === "follow") {
    taskFollow = true;
    const btn = document.getElementById("btn-follow");
    btn.classList.add("success-task");
    btn.innerText = "Followed @kelpWeaversNft";
  } else if (task === "like") {
    taskLike = true;
    const btn = document.getElementById("btn-like");
    btn.classList.add("success-task");
    btn.innerText = "Liked";
  } else if (task === "quote") {
    taskQuote = true;
    const btn = document.getElementById("btn-quote");
    btn.classList.add("success-task");
    btn.innerText = "Quoted";
  } else if (task === "tag") {
    taskTag = true;
    const btn = document.getElementById("btn-tag");
    btn.classList.add("success-task");
    btn.innerText = "Tagged a fren";
  }
}

function nextStep(currentStep) {
  if (currentStep > 0) {
    const errorMsg = document.getElementById(`error-${currentStep}`);
    if (errorMsg) errorMsg.style.display = "none";

    if (currentStep === 1) {
      const email = document.getElementById("email").value.trim();
      if (!email.includes("@") || email.length < 5) {
        errorMsg.style.display = "block";
        return;
      }
    } else if (currentStep === 2) {
      const wallet = document.getElementById("wallet").value.trim();
      if (!wallet.startsWith("0x") || wallet.length !== 42) {
        errorMsg.innerText = "Please enter a valid 42-character wallet address.";
        errorMsg.style.display = "block";
        return;
      }
    } else if (currentStep === 4) {
      const tweetLink = document.getElementById("tweetLink").value.trim();
      if (
        (!tweetLink.includes("x.com/") && !tweetLink.includes("twitter.com/")) ||
        !taskFollow ||
        !taskLike ||
        !taskQuote ||
        !taskTag
      ) {
        errorMsg.innerText = "Please enter a valid link and complete all social tasks.";
        errorMsg.style.display = "block";
        return;
      }

      const submitBtn = document.getElementById("submit-btn");
      submitBtn.innerText = "Submitting...";
      submitBtn.disabled = true;

      const payload = {
        email: document.getElementById("email").value.trim(),
        walletAddress: document.getElementById("wallet").value.trim(),
        xUsername: tweetLink,
      };

      const refVal = document.getElementById("referral").value.trim();
      if (refVal !== "") {
        payload.referral = refVal;
      }

      fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.message || "Registration failed");
          return data;
        })
        .then((data) => {
          if (data.success) {
            showSuccessData(data.user, false);
            document.getElementById("step-4").classList.add("hidden");
          } else {
            throw new Error(data.message || "Failed to join waitlist. Try again.");
          }
        })
        .catch((error) => {
          console.error("Register Error:", error);
          errorMsg.innerText = error.message || "Network error. Please try again.";
          errorMsg.style.display = "block";
          submitBtn.innerText = "Verify & Join";
          submitBtn.disabled = false;
        });

      return;
    }
  }

  transitionToStep(currentStep, currentStep + 1);
}

function showSuccessData(userData, isLogin) {
  const authTabs = document.getElementById("auth-tabs");
  const flowReg = document.getElementById("flow-register");
  const flowLog = document.getElementById("flow-login");

  if (authTabs) authTabs.classList.add("hidden");
  if (flowReg) flowReg.classList.add("hidden");
  if (flowLog) flowLog.classList.add("hidden");

  document.getElementById("disp-email").innerText = userData.email;
  document.getElementById("disp-wallet").innerText = userData.walletAddress;
  document.getElementById("disp-referral").innerText = userData.referral;
  document.getElementById("disp-tweet").innerText = userData.xUsername;

  const dispScore = document.getElementById("disp-score");
  if (dispScore) dispScore.innerText = userData.score;

  document.getElementById("step-5").classList.remove("hidden");
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });

  if (isLogin) {
    switchTab("pass");
    const tabVideo = document.querySelector("#tab-video");
    const tabs = document.querySelector(".tabs");
    if (tabVideo) tabVideo.remove();
    if (tabs) tabs.remove();
  } else {
    setTimeout(() => {
      switchTab("pass");
    }, 4500);
  }
}

function transitionToStep(current, next) {
  document.getElementById(`step-${current}`).classList.add("hidden");
  document.getElementById(`step-${next}`).classList.remove("hidden");
  window.scrollTo({ top: document.getElementById("waitlist")?.offsetTop || 0, behavior: "smooth" });
}

function prevStep(currentStep) {
  const errorMsg = document.getElementById(`error-${currentStep}`);
  if (errorMsg) errorMsg.style.display = "none";

  document.getElementById(`step-${currentStep}`).classList.add("hidden");
  document.getElementById(`step-${currentStep - 1}`).classList.remove("hidden");
}

function switchTab(tab) {
  const tabVideo = document.getElementById("tab-video");
  const tabPass = document.getElementById("tab-pass");
  const btnVideo = document.getElementById("tab-btn-video");
  const btnPass = document.getElementById("tab-btn-pass");

  if (!tabPass) return;

  if (tabVideo) {
    tabVideo.classList.add("hidden");
    tabVideo.classList.remove("active");
  }
  tabPass.classList.add("hidden");
  tabPass.classList.remove("active");
  if (btnVideo) btnVideo.classList.remove("active");
  if (btnPass) btnPass.classList.remove("active");

  const target = document.getElementById(`tab-${tab}`);
  const btn = document.getElementById(`tab-btn-${tab}`);
  if (target) {
    target.classList.remove("hidden");
    target.classList.add("active");
  }
  if (btn) btn.classList.add("active");
}

const leafField = document.getElementById("leaf-field");

function createLeaf() {
  if (!leafField) return;
  const leaf = document.createElement("div");
  leaf.classList.add("leaf");

  const size = Math.random() * 16 + 10;
  const left = Math.random() * 100;
  const duration = Math.random() * 10 + 8;

  leaf.style.width = `${size}px`;
  leaf.style.height = `${size * 1.5}px`;
  leaf.style.left = `${left}%`;
  leaf.style.animation = `driftUp ${duration}s ease-in forwards`;

  leaf.addEventListener("mousedown", (e) => {
    const rect = leaf.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    let points = 10;
    if (size < 18) points = 30;
    if (size < 14) points = 50;

    totalScore += points;
    if (scoreDisplay) scoreDisplay.innerText = totalScore;

    leaf.remove();
    showFloatingScore(points, x, y);
  });

  leafField.appendChild(leaf);

  setTimeout(() => {
    if (leafField.contains(leaf)) leaf.remove();
  }, duration * 1000);
}

function showFloatingScore(points, x, y) {
  const scoreEl = document.createElement("div");
  scoreEl.classList.add("floating-score");
  scoreEl.innerText = `+${points}`;
  scoreEl.style.left = `${x - 20}px`;
  scoreEl.style.top = `${y - 20}px`;
  document.body.appendChild(scoreEl);
  setTimeout(() => scoreEl.remove(), 1000);
}

function copyReferral() {
  const code = document.getElementById("disp-referral").innerText;
  const refText = `${window.location.origin}/?referral=${code}`;

  if (code && code !== "None" && code !== "N/A") {
    navigator.clipboard.writeText(refText).then(() => {
      const copyBtn = document.getElementById("copy-btn");
      copyBtn.innerText = "Copied!";
      setTimeout(() => {
        copyBtn.innerText = "Copy";
      }, 2000);
    });
  }
}

function shareToX() {
  const refText = document.getElementById("disp-referral").innerText;
  const tweetText = encodeURIComponent(
    `Locked into the Raft with @kelpWeaversNft.\n\n8888 Clever Kelpweavers weaving joy into the Eternal Stream.\n\nJoin early:\n${window.location.origin}/?referral=${refText}`
  );
  window.open(`https://x.com/intent/tweet?text=${tweetText}`, "_blank");
}

setInterval(createLeaf, 700);

const weaveModal = document.getElementById("weave-modal");
const scoreboardBtn = document.getElementById("scoreboard");

function openWeaveModal() {
  if (!weaveModal) return;
  weaveModal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeWeaveModal() {
  if (!weaveModal) return;
  weaveModal.classList.add("hidden");
  document.body.style.overflow = "";
}

if (scoreboardBtn) {
  scoreboardBtn.addEventListener("click", openWeaveModal);
}

if (weaveModal) {
  weaveModal.querySelectorAll("[data-close-weave]").forEach((el) => {
    el.addEventListener("click", closeWeaveModal);
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && weaveModal && !weaveModal.classList.contains("hidden")) {
    closeWeaveModal();
  }
});

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

function initScrollReveal() {
  if (prefersReducedMotion || !("IntersectionObserver" in window)) return;

  const targets = Array.from(
    document.querySelectorAll(
      ".gallery__head, .nft, .waitlist__intro, .tweets__head, .tweet, .tweets__cta, .site-footer__inner"
    )
  );
  if (!targets.length) return;

  document.documentElement.classList.add("js-reveal");
  targets.forEach((el) => el.classList.add("reveal"));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const el = entry.target;
        const siblings = el.parentElement
          ? Array.from(el.parentElement.children).filter((node) =>
              node.classList.contains("reveal")
            )
          : [];
        const order = Math.max(siblings.indexOf(el), 0);

        el.style.transitionDelay = `${Math.min(order, 5) * 90}ms`;
        el.classList.add("reveal--in");
        observer.unobserve(el);
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
  );

  targets.forEach((el) => observer.observe(el));
}

function initHeroParallax() {
  if (prefersReducedMotion) return;

  const media = document.querySelector(".hero__media");
  const hero = document.querySelector(".hero");
  if (!media || !hero) return;

  let pending = false;

  const update = () => {
    pending = false;
    const heroHeight = hero.offsetHeight || window.innerHeight;
    const progress = Math.min(Math.max(window.scrollY / heroHeight, 0), 1);
    media.style.transform = `translate3d(0, ${progress * 6}%, 0)`;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(update);
    },
    { passive: true }
  );

  update();
}

initScrollReveal();
initHeroParallax();
