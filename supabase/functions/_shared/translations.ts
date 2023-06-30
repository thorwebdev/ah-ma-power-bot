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
      cn: "抱歉, 发生了错误! 请尝试使用“/start”命令再次操作! ",
      ms: "Maaf, terdapat ralat! Sila cuba lagi dengan menggunakan perintah /start!",
      ta: "மன்னிக்கவும், பிழை ஏற்பட்டுள்ளது! தயவுசெய்து /start கட்டளையைப் பயன்படுத்தி மீண்டும் முயற்சிக்கவும்!",
    },
    welcome: {
      en: `Hello! I'm Dove, and I'm here to help you make a resume. 📄\n\nSimply answer my questions to get your brand new resume at the end.\n\nIf you're ready, please choose your preferred language. 😊`,
      cn: `你好! 我是Dove, 我在这里帮助你制作简历.📄\n\n只需回答我的问题, 最后就能得到全新的简历.\n\n如果你准备好了, 请选择你偏好的语言.😊`,
      ms: `Hai! Saya Dove, dan saya di sini untuk membantu kamu membuat resume. 📄\n\nHanya jawab soalan-soalan saya untuk mendapatkan resume baru kamu pada akhirnya.\n\nJika kamu sudah sedia, sila pilih bahasa pilihan kamu. 😊`,
      ta: `வணக்கம்! நான் டவ் என்பது, மீண்டும் நேற்றுக்குள் நீங்கள் ஒரு ரிசியூமை உருவாக்க உதவ இங்கே இருக்கிறேன். 📄\n\nஎனது கேள்விகளுக்கு பதிலளிக்கும் மூன்றுவது முகநூலை கீழே அடுத்து பெற தயவுசெய்து மீண்டும் அதைப் பயன்படுத்தவும்.\n\nதயவுகூர்ந்து உங்கள் விரும்பிய மொழியைத் தேர்ந்தெடுக்கவும். 😊`,
    },
    "step-0": {
      en: `Great, let's get started 🚀\n \nWhat's your full name?`,
      cn: `太好了, 讓我們開始吧 🚀\n \n你的全名是什麼?`,
      ms: `Hebat, mari kita mulakan 🚀\n \nApakah nama penuh anda?`,
      ta: `அருமை, தொடங்குவோம் 🚀\n \nஉங்கள் முழு பெயர் என்ன?`,
    },
    "step-1": {
      en: `Hope you're having a lovely day, ${text}! 😊\n\nWhat's your mobile number?`,
      cn: `希望你今天过得愉快, ${text}! 😊\n\n请问你的手机号码是多少?`,
      ms: `Semoga hari kamu menyenangkan, ${text}! 😊\n\nApa nombor telefon bimbit kamu?`,
      ta: `உங்களுக்கு அருகிலுள்ள நாள் இருக்கிறது என்று நம்புகிறேன், ${text}! 😊\n\nஉங்கள் மொபைல் எண் என்ன?`,
    },
    "step-2": {
      en: "Thank you! How old are you this year?",
      cn: "谢谢! 你今年多大了?",
      ms: "Terima kasih! Berapa umur kamu tahun ini?",
      ta: "நன்றி! இந்த ஆண்டு உங்கள் வயது எத்தனை?",
    },
    "step-3": {
      en: `Now tell us a bit about your work experience! 💼\n\nYou can answer using voice message in any language, no need to type! 🗣️\n\nHere are some things you can talk about:
\n• What was your current or last job?\n• What did you do at that job?\n• When was that job?\n• Are you willing to upskill for a new job?`,
      cn: `现在请告诉我们一些你的工作经验吧!  💼\n\n你可以用语音留言回答, 可以使用任何语言, 无需打字!  🗣️\n\n以下是一些你可以谈论的内容：
\n• 你目前或上一份工作是什么?\n• 你在那份工作中做了什么?\n• 那份工作是什么时候的?\n• 你是否愿意通过学习提升自己来寻找新的工作机会?`,
      ms: `Sekarang ceritakan sedikit mengenai pengalaman kerja kamu! 💼\n\nKamu boleh menjawab menggunakan mesej suara dalam apa-apa bahasa, tidak perlu menaip! 🗣️\n\nBerikut adalah beberapa perkara yang boleh kamu ceritakan:
\n• Apakah pekerjaan kamu semasa atau yang terakhir?\n• Apa yang kamu lakukan dalam pekerjaan tersebut?\n• Bilakah pekerjaan itu berlaku?\n• Adakah kamu bersedia untuk meningkatkan kemahiran untuk pekerjaan baru?`,
      ta: `இப்போது உங்கள் பணியாளர் அனுபவத்தை சில விபரங்களைக் கொடுக்கவும்! 💼\n\nநீங்கள் பதிலளிப்பீர்கள், எந்த மொழியில் ஆலோசிக்க முடியும், தட்டச்சு தேவையில்லை! 🗣️\n\nஇத்தனையும் பற்றி பேசலாம்:
\n• உங்கள் தற்போதைய அல்லது கடைசி பணியாளர் எது?\n• அப்படியே அதில் நீங்கள் என்ன செய்தீர்கள்?\n• அது எப்போது நடந்தது?\n• புதிய பணியில் நீங்கள் மேம்படுத்துவது விரும்புகிறீர்க`,
    },

    "step-4": {
      en: `Thank you! Lastly, please take a picture of your face using the front camera of your phone, preferably with a white background. \n\nReply with "No" if you prefer not to.`,
      cn: `谢谢! 最后, 请使用手机的前置摄像头拍一张你的脸部照片, 最好是在白色背景下.\n\n如果你不想拍照, 请回复"No".`,
      ms: `Terima kasih! Terakhir, sila ambil gambar muka kamu menggunakan kamera hadapan telefon kamu, lebih baik dengan latar belakang putih.\n\nBalas dengan "No" jika kamu tidak mahu.`,
      ta: `நன்றி! கடைசியாக, தயவுசெய்து உங்கள் மொக்கை முகத்தைத் தங்கப் படம் எடுக்கவும், முன் கேமராவைப் பயன்படுத்துவது நலமாக அமைத்துக்கொள்ளுங்கள். மின்னஞ்சல் அஞ்சலில் "No" என்று பதிலளிக்கவும்.`,
    },
    "step-5": {
      en: `Please hold on while we generate your resume. You will get a notification once your resume is ready.`,
      cn: `请稍等, 我们正在生成你的简历.一旦你的简历准备好, 你将收到通知.`,
      ms: `Harap tunggu sebentar sementara kami menghasilkan resume kamu. Kamu akan menerima pemberitahuan apabila resume kamu sudah siap.`,
      ta: `உங்கள் ரிசியூமை உருவாக்குவதற்கு காத்திருங்கள். உங்கள் ரிசியூம் தயாராயில்லையெனில், ஒரு அறிவிப்பைப் பெறுவீர்கள்.`,
    },
    "step-6": {
      en: "Almost finished\\! Please review your resume and let us know if your happy for us to submit it to the SilverJobs platform\\. \n\n By tapping *Apply* you agree to the SilverJobs [Terms & Conditions](https://silverjobs.sg/site/tnc) and for [CFS](https://cfs.org.sg) \\(Centre for Seniors\\) to contact you for future opportunities\\.",
      cn: "就快结束了\\! 请查看您的简历, 并告知我们您是否愿意我们将其提交到 SilverJobs 平台\\. \n\n 点击*应用*即表示您同意 SilverJobs [条款和条件](https://silverjobs.sg/site/tnc) 以及 [CFS](https://cfs.org.sg) \\(老年人中心\\) 与您联系以获得未来的机会\\.",
      ms: "Hampir siap\\! Sila semak resume anda dan beritahu kami jika anda gembira untuk kami menyerahkannya ke platform SilverJobs\\. \n\n Dengan mengetik *Mohon* anda bersetuju menerima [Terma & Syarat SilverJobs](https://silverjobs.sg/site/tnc) dan untuk [CFS](https://cfs.org.sg) \\(Pusat Warga Emas\\) untuk menghubungi anda untuk peluang masa hadapan\\.",
      ta: "கிட்டத்தட்ட முடிந்துவிட்டது\\! உங்கள் விண்ணப்பத்தை மதிப்பாய்வு செய்து, அதை SilverJobs தளத்திற்குச் சமர்ப்பிப்பதில் நீங்கள் மகிழ்ச்சியடைகிறீர்களா என்பதை எங்களுக்குத் தெரிவிக்கவும். \n\n *விண்ணப்பிக்கவும்* என்பதைத் தட்டுவதன் மூலம் SilverJobs [விதிமுறைகள் & நிபந்தனைகள்](https://silverjobs.sg/site/tnc) மற்றும் [CFS](https://cfs.org.sg) ஆகியவற்றை ஏற்கிறீர்கள். வேலை சுருக்கங்கள்) \\(முதியோர்களுக்கான மையம்\\) எதிர்கால வாய்ப்புகளுக்கு உங்களைத் தொடர்பு கொள்ள\\.",
    },
    "step-final": {
      en: "Thank you, your resume has been submitted to SilverJobs and they will contact you when suitable opportunities come up.",
      cn: "謝謝, 您的簡歷已提交給SilverJobs, 當有合適的機會時, 他們會與您聯繫",
      ms: "Terima kasih, resume anda telah diserahkan kepada SilverJobs dan mereka akan menghubungi anda apabila peluang yang sesuai muncul.",
      ta: "நன்றி, உங்கள் விண்ணப்பம் SilverJobs-க்கு சமர்ப்பிக்கப்பட்டுள்ளது, பொருத்தமான வாய்ப்புகள் வரும்போது அவர்கள் உங்களைத் தொடர்புகொள்வார்கள்.",
    },
    apply: {
      en: "Apply",
      cn: "应用",
      ms: "Mohon",
      ta: "விண்ணப்பிக்கவும்",
    },
    restart: {
      en: "Restart",
      cn: "重新启动",
      ms: "Mulakan semula",
      ta: "மீண்டும் துவக்கம் செய்",
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
