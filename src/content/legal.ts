// Privacy notice and terms. DRAFTS written by the builder: they MUST be reviewed by a qualified adviser before launch (gate G-5).
export interface Section { heading: string; body: string[] }
export interface LegalDoc { title: string; updated: string; intro: string; sections: Section[] }

const CONTACT = "Ogora Delmus Mocheche (ogoradelmus1@gmail.com)";

export const privacy: Record<"en" | "sw", LegalDoc> = {
  en: {
    title: "Privacy notice",
    updated: "Version 2026-09-19 (draft for review)",
    intro: "Ministry Report is a private tool of the Nyamira congregation for monthly ministry reporting. This notice says what we collect, who can see it, and what you can ask us to do.",
    sections: [
      { heading: "Who is responsible", body: [`The Nyamira congregation is responsible for the information in this system. Contact: ${CONTACT}.`] },
      { heading: "What we collect and why", body: [
        "Your official name, username, email address, phone or WhatsApp number, service group and language, so we can confirm who you are and reach you.",
        "A profile photo that you crop yourself, so the Elders can recognise the person requesting access.",
        "Your monthly ministry report (participation, hours for pioneers, studies and an optional short comment), because reporting is the purpose of this tool.",
        "A record of sign-ins, approvals and changes (the audit trail), to keep reports accurate and protect against mistakes.",
        "Information about ministry activity can reveal religious belief. We treat it as sensitive, collect only what is needed, and ask for your consent when you request access.",
      ] },
      { heading: "Who can see what", body: [
        "You see your own reports and history.",
        "Elders see every report, comment, photo and member detail in the congregation.",
        "Ministerial Servants see only new access requests (name, photo, contact details and requested arrangement) so they can approve them. They cannot see reports.",
        "Nobody except you can see your private hours log or your return visits. This includes Elders and Ministerial Servants.",
        "The system administrator of the hosting accounts technically has access to the database. We limit what is stored and we keep such access to the smallest number of people.",
      ] },
      { heading: "Services that process the data", body: [
        "Supabase (database, sign-in and photo storage), Vercel (website hosting) and an email service. These providers host data outside Kenya.",
        "We do not use advertising or analytics trackers. Only essential cookies are used (your sign-in session and your theme and language choice).",
      ] },
      { heading: "How long we keep it", body: [
        "Reports, arrangements and the audit trail are kept until you ask for your data to be deleted. Then your identity is removed and only the numbers stay, so past congregation totals remain correct.",
        "Notifications are kept for 90 days. Sign-in throttle records are kept for 30 days.",
      ] },
      { heading: "Your rights", body: [
        "You may ask to see, correct or delete your information, and you may object to its use. Ask any Elder or write to the contact above.",
        "If you are not satisfied with our answer you may complain to the Office of the Data Protection Commissioner of Kenya.",
        "Backups made before a deletion keep the old data until they are rotated out.",
      ] },
      { heading: "Children", body: ["People under 18 do not sign up themselves. An Elder adds them, with their parent or guardian's consent recorded outside the app."] },
    ],
  },
  sw: {
    title: "Taarifa ya faragha",
    updated: "Toleo 2026-09-19 (rasimu ya kukaguliwa)",
    intro: "Ripoti ya Huduma ni zana ya faragha ya kutaniko la Nyamira kwa kuripoti huduma kila mwezi. Taarifa hii inaeleza tunachokusanya, nani anaweza kukiona, na unachoweza kutuomba.",
    sections: [
      { heading: "Nani anawajibika", body: [`Kutaniko la Nyamira linawajibika kwa taarifa zilizo katika mfumo huu. Mawasiliano: ${CONTACT}.`] },
      { heading: "Tunachokusanya na kwa nini", body: [
        "Jina lako rasmi, jina la mtumiaji, barua pepe, nambari ya simu au WhatsApp, kikundi cha huduma na lugha, ili tuthibitishe wewe ni nani na kukufikia.",
        "Picha ya wasifu unayoikata mwenyewe, ili wazee wamtambue mtu anayeomba kuingia.",
        "Ripoti yako ya huduma ya kila mwezi (kushiriki, saa kwa mapainia, mafunzo na maoni mafupi ya hiari), kwa sababu kuripoti ndilo kusudi la zana hii.",
        "Rekodi ya kuingia, idhini na mabadiliko (kumbukumbu ya ukaguzi), ili ripoti ziwe sahihi.",
        "Taarifa za huduma zinaweza kufichua imani ya kidini. Tunazichukulia kama nyeti, tunakusanya tu kinachohitajika, na tunaomba idhini yako unapoomba kuingia.",
      ] },
      { heading: "Nani anaona nini", body: [
        "Wewe unaona ripoti na historia yako mwenyewe.",
        "Wazee wanaona ripoti zote, maoni, picha na maelezo ya washiriki wa kutaniko.",
        "Watumishi wa huduma wanaona tu maombi mapya ya kuingia ili wayaidhinishe. Hawawezi kuona ripoti.",
        "Hakuna mwingine ila wewe anayeweza kuona kumbukumbu yako ya saa au ziara zako za kurudia, wakiwemo wazee.",
        "Msimamizi wa akaunti za mwenyeji ana ufikiaji wa kiufundi wa hifadhidata. Tunapunguza kinachohifadhiwa na kuweka ufikiaji huo kwa watu wachache zaidi.",
      ] },
      { heading: "Huduma zinazochakata data", body: [
        "Supabase (hifadhidata, kuingia na picha), Vercel (mwenyeji wa tovuti) na huduma ya barua pepe. Watoa huduma hawa huhifadhi data nje ya Kenya.",
        "Hatutumii vifuatiliaji vya matangazo au uchanganuzi. Vidakuzi muhimu tu ndivyo vinavyotumika.",
      ] },
      { heading: "Muda wa kuhifadhi", body: [
        "Ripoti, mipango ya huduma na kumbukumbu ya ukaguzi huhifadhiwa hadi uombe data yako ifutwe. Kisha utambulisho wako huondolewa na namba pekee hubaki.",
        "Arifa huhifadhiwa siku 90. Rekodi za kudhibiti majaribio ya kuingia huhifadhiwa siku 30.",
      ] },
      { heading: "Haki zako", body: [
        "Unaweza kuomba kuona, kusahihisha au kufuta taarifa zako, na kupinga matumizi yake. Muulize mzee yeyote au andika kwa mawasiliano hapo juu.",
        "Usiporidhika na jibu letu, unaweza kulalamika kwa Ofisi ya Kamishna wa Ulinzi wa Data ya Kenya.",
      ] },
      { heading: "Watoto", body: ["Watu walio chini ya miaka 18 hawajisajili wenyewe. Mzee huwaongeza, na idhini ya mzazi au mlezi hurekodiwa nje ya programu."] },
    ],
  },
};

export const terms: Record<"en" | "sw", LegalDoc> = {
  en: {
    title: "Terms of use",
    updated: "Version 2026-09-19 (draft for review)",
    intro: "These terms apply to everyone who uses Ministry Report for the Nyamira congregation.",
    sections: [
      { heading: "Who may use it", body: ["Baptized publishers of the congregation, after an Elder or Ministerial Servant approves the request. Use your official name."] },
      { heading: "Report honestly", body: ["Report your own ministry accurately. A submitted report is locked. If something is wrong, ask an Elder to reopen it. Every change is recorded."] },
      { heading: "Keep your account safe", body: ["Do not share your password. Elders and Ministerial Servants must use two-factor authentication and keep their recovery codes offline."] },
      { heading: "Comments and private notes", body: ["Do not write private details about other people in comments or return visits. Store only a first name and a general area for a householder."] },
      { heading: "Removing access", body: ["An Elder may deactivate an account when a person moves or stops reporting. You may ask for your data to be deleted at any time."] },
      { heading: "Availability", body: ["We aim to keep the service running, but we cannot promise it is always available. Keep the old method for reporting if the service is down."] },
    ],
  },
  sw: {
    title: "Masharti ya matumizi",
    updated: "Toleo 2026-09-19 (rasimu ya kukaguliwa)",
    intro: "Masharti haya yanamhusu kila anayetumia Ripoti ya Huduma kwa kutaniko la Nyamira.",
    sections: [
      { heading: "Nani anaweza kutumia", body: ["Wahubiri waliobatizwa wa kutaniko, baada ya mzee au mtumishi wa huduma kuidhinisha ombi. Tumia jina lako rasmi."] },
      { heading: "Ripoti kwa uaminifu", body: ["Ripoti huduma yako mwenyewe kwa usahihi. Ripoti iliyowasilishwa hufungwa. Kama kuna kosa, mwombe mzee aifungue tena. Kila mabadiliko hurekodiwa."] },
      { heading: "Linda akaunti yako", body: ["Usishiriki nenosiri lako. Wazee na watumishi wa huduma lazima watumie uthibitishaji wa hatua mbili na kuhifadhi nambari za dharura nje ya mtandao."] },
      { heading: "Maoni na maelezo ya faragha", body: ["Usiandike maelezo ya faragha ya watu wengine kwenye maoni au ziara za kurudia. Hifadhi jina la kwanza na eneo la jumla pekee."] },
      { heading: "Kuondoa ufikiaji", body: ["Mzee anaweza kuzima akaunti mtu anapohama au anaposimama kuripoti. Unaweza kuomba data yako ifutwe wakati wowote."] },
      { heading: "Upatikanaji", body: ["Tunajitahidi huduma iendelee, lakini hatuwezi kuahidi itapatikana kila wakati. Tumia njia ya zamani ya kuripoti huduma ikizimika."] },
    ],
  },
};
