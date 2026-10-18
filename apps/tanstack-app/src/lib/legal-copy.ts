export const legalDetails = {
  operator: 'ColdStone co.',
  supportEmail: 'zw83716@gmail.com',
  updated: 'October 15, 2026',
  updatedLabel: 'Last updated:',
  contactHeading: 'Contact',
  contactLead: 'For support, privacy requests or questions about these terms, email',
} as const

export const legalPages = {
  privacy: {
    path: '/privacy-policy',
    label: 'Privacy Policy',
    title: 'Privacy Policy | Zombie Couple Video',
    description: 'How ColdStone co. handles visitor sessions, uploaded photos and video generation data for Zombie Couple Video.',
    intro: 'ColdStone co. operates Zombie Couple Video. This policy describes the information used for visitor sessions and photo-to-video generation.',
    sections: [
      {
        heading: 'Your photo choices at a glance',
        paragraphs: [
          'Selecting or previewing a photo keeps it on your device. Uploading starts only when you select Generate video. You can change or remove a selected photo before starting. Removing a local preview does not delete a copy that was uploaded during an earlier attempt.',
          'We use uploaded photos to create your requested clip and to address related service or deletion requests. Uploading does not add your photos or result to the public example gallery on this website. Public image links are used for video processing; anyone with such a link can view the image.',
        ],
      },
      {
        heading: 'Information used by the service',
        paragraphs: [
          'The service creates an anonymous session with a generated internal identifier to associate uploads and video tasks with your browser. Registration, a name, an email address and a password are not required. Session records can include your IP address and browser information.',
          'When you generate a video, the service processes the photos you select, your editable story text, the prepared generation instructions, job status and a link to the resulting video. Support emails contain the information you choose to send us.',
        ],
      },
      {
        heading: 'Why we use this information',
        paragraphs: [
          'Visitor sessions protect access to uploads and video tasks. Internal credit records track generation usage and failure recovery. Uploaded photos and generation instructions are needed to create your requested video. Technical logs help diagnose errors and protect the service from misuse.',
          'We use information sent to the support address to respond to your request. Avoid including passwords, API keys or unnecessary personal information in your message.',
        ],
      },
      {
        heading: 'Storage and video processing',
        paragraphs: [
          'Cloudflare provides the application hosting, D1 visitor and task database, and R2 photo storage. AutoDL receives the reference-image URLs and generation instructions to run the video workflow. These providers process data on their own infrastructure and may process it outside your country.',
          'Uploaded reference photos use HTTPS storage URLs so the video provider can retrieve them. These are public links, not private or password-protected photo links. Anyone who has a link can access that image. Choose photos you have permission to use and are comfortable sharing through this processing method. A local preview alone does not upload a photo.',
        ],
      },
      {
        id: 'photo-retention',
        heading: 'Retention and deletion requests',
        paragraphs: [
          'Uploaded photos are automatically deleted from our R2 storage by our cleanup process. Visitor, task and internal credit records are managed separately from uploaded photo files.',
          'You can request deletion of copies in our storage by emailing zw83716@gmail.com. Include the approximate generation date and time and any task reference or image URL you retained, so we can identify the relevant uploads. You do not need to attach the photos again. We may ask for information to verify that the request concerns your uploads.',
          'After identifying and verifying the relevant uploads, we can remove the copies held in our R2 storage. Removing those copies does not recall anything previously downloaded or delete copies retained by the video provider. Provider retention and deletion are subject to that provider’s own policies. Generated-video links can expire, so save any result you want to keep while it is available.',
        ],
      },
      {
        heading: 'Cookies and analytics',
        paragraphs: [
          'The service uses a signed, HttpOnly visitor cookie for session continuity and misuse prevention. This cookie can last up to one year. We also use short-lived, keyed hashes of Cloudflare-provided IP addresses to limit request bursts; the trial rate counters do not store raw IP addresses.',
          'The authentication system uses session cookies, and the interface may store your theme preference in the browser. The current tab also keeps your latest video task ID for up to 24 hours; photos are not stored in this browser record.',
          'We use PostHog for basic visit and referral-source statistics, including visits from AI assistants. A page-load event includes the page URL, referring website, campaign tags, and browser and device information. PostHog uses anonymous identifiers in browser storage to estimate visitor counts. Its US-hosted service processes analytics requests, including the network information needed to receive them.',
          'We do not send uploaded photos, filenames, story text, generated media links, or your internal visitor-session identifier to PostHog. Session recordings and automatic click tracking are disabled. We remove unrelated query parameters and URL fragments from page URLs and keep only the origin of referring websites.',
        ],
      },
    ],
  },
  terms: {
    path: '/terms-of-service',
    label: 'Terms of Service',
    title: 'Terms of Service | Zombie Couple Video',
    description: 'Terms for using the Zombie Couple Video photo-to-video tool operated by ColdStone co., including uploads, free trials and generated results.',
    intro: 'These terms cover your use of Zombie Couple Video, operated by ColdStone co. Please read them before uploading photos or starting a generation.',
    sections: [
      {
        heading: 'The service',
        paragraphs: [
          'The tool creates a new video from character photos and an editable zombie couple story. It uses an AI generation provider. Faces, motion and shot timing can vary; a particular likeness, exact actions or completion time is not guaranteed.',
          'Zombie Couple Video is an independent tool. It is not affiliated with the creators of other zombie couple videos or any film.',
        ],
      },
      {
        heading: 'Your browser session and photos',
        paragraphs: [
          'Keep cookies enabled while using the maker so it can associate your uploads and video tasks with the same browser session. You are responsible for the photos and generation requests you submit.',
          'Both people shown must be adults. Upload only photos you have permission to use, including the permission needed to depict identifiable people. Do not use the tool to harass people, commit fraud or create unlawful content. We may restrict access when the service is misused.',
        ],
      },
      {
        heading: 'Permission to process uploads',
        paragraphs: [
          'You keep any rights you already hold in your uploads. By starting generation, you allow us and the service providers to store and process those uploads to produce and deliver the requested video.',
          'You are responsible for checking whether your intended use of an output respects other people’s rights. The service does not guarantee that an AI output is unique or that it grants exclusive rights in the result.',
        ],
      },
      {
        heading: 'Free trial and generation',
        paragraphs: [
          'Video generation is free for a limited time, without registration or payment. The current offer includes one successful video per browser, tracked through visitor and session cookies. Availability is subject to service limits.',
          'When the provider reports a failed generation and the internal refund completes, the free opportunity is restored. Contact support if it remains unavailable after a failure. A completed video that differs from your expectations still counts as a successful generation. Short-term network limits may temporarily delay retries.',
          'Any future paid offer must show its price and applicable purchase terms before payment. These terms do not establish an unannounced subscription or automatic renewal.',
        ],
      },
      {
        heading: 'Availability and downloads',
        paragraphs: [
          'Generation can take a few minutes. Keep the tool open while a job runs, preview the result, and download the MP4 to your device. The application does not currently provide a permanent video library.',
          'Temporary links and unfinished job status can become unavailable. Contact support with the approximate generation time and any task reference you retained if you need help with an interrupted job.',
        ],
      },
      {
        heading: 'Changes and applicable rights',
        paragraphs: [
          'We may update the tool and these terms. The date on this page identifies the current version. Nothing in these terms is intended to remove rights that applicable law does not allow us to exclude.',
        ],
      },
    ],
  },
} as const
