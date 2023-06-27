export const prompts = ({
  key,
  language,
  text,
}: {
  key: string;
  language: string;
  text?: string;
}) => {
  const prompts: { [key: string]: { [key: string]: string } } = {
    error: {
      en: "Sorry, there was an error! Please try again using the /start command!",
    },
    welcome: {
      en: `Hello! I'm Dove, and I'm here to help you make a resume. 📄\n\nSimply answer my questions to get your brand new resume at the end.\n\nIf you're ready, please choose your preferred language. 😊`,
    },
    "step-0": {
      en: `Great, let's get started 🚀\n \nWhat's your full name?`,
      cn: `太好了，讓我們開始吧 🚀\n \n你的全名是什麼？`,
      ms: `Hebat, mari kita mulakan 🚀\n \nApakah nama penuh anda?`,
      ta: `அருமை, தொடங்குவோம் 🚀\n \nஉங்கள் முழு பெயர் என்ன?`,
    },
    "step-1": {
      en: `Hope you're having a lovely day, ${text}! 😊\n\nWhat's your mobile number?`,
    },
    "step-2": {
      en: "Thank you! How old are you this year?",
    },
    "step-3": {
      en: `Now tell us a bit about your work experience! 💼\n\nYou can answer using voice message in any language, no need to type! 🗣️\n\nHere are some things you can talk about:
\n• What was your current or last job?\n• What did you do at that job?\n• When was that job?\n• Are you willing to upskill for a new job?`,
    },
    "step-4": {
      en: `Thank you! Lastly, please take a picture of your face using the front camera of your phone, preferably with a white background. \n\nReply with "No" if you prefer not to.`,
    },
    "step-5": {
      en: `Please hold on while we generate your resume. You will get a notification once your resume is ready.`,
    },
  };
  if (!prompts[key]?.[language])
    throw new Error(
      `Translation lookup failed for: ${JSON.stringify({
        key,
        language,
        text,
      })}`
    );
  return prompts[key][language];
};
