import React, {
  useEffect,
  useState,
} from "react";

import CompetitionDetails from "./components/CompetitionDetails";
import ReviewSubmit from "./components/ReviewSubmit";
import Payment from "./components/Payment";

import "./Register.css";


/* =========================================================
   API
========================================================= */

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";


/* =========================================================
   REGISTRATION FEE
========================================================= */

const BASE_REGISTRATION_FEE = 999;

const VALID_REGISTRATION_AMOUNTS = [
  999,
  899,
  799,
];


/* =========================================================
   COUPONS
========================================================= */

const COUPONS = {
  UDAYBHANU0246: {
    code: "UDAYBHANU0246",
    type: "UDAYBHANU",
    amount: 899,
  },

  GTST0246: {
    code: "GTST0246",
    type: "GTST",
    amount: 799,
  },
};


/* =========================================================
   DISTRICTS
========================================================= */

const districts = {
  Telangana: [
    "Adilabad",
    "Bhadradri Kothagudem",
    "Hanumakonda",
    "Hyderabad",
    "Jagtial",
    "Jangaon",
    "Jayashankar Bhupalapally",
    "Jogulamba Gadwal",
    "Kamareddy",
    "Karimnagar",
    "Khammam",
    "Komaram Bheem Asifabad",
    "Mahabubabad",
    "Mahabubnagar",
    "Mancherial",
    "Medak",
    "Medchal-Malkajgiri",
    "Mulugu",
    "Nagarkurnool",
    "Nalgonda",
    "Narayanpet",
    "Nirmal",
    "Nizamabad",
    "Peddapalli",
    "Rajanna Sircilla",
    "Rangareddy",
    "Sangareddy",
    "Siddipet",
    "Suryapet",
    "Vikarabad",
    "Wanaparthy",
    "Warangal",
    "Yadadri Bhuvanagiri",
  ],

  "Andhra Pradesh": [
    "Alluri Sitharama Raju",
    "Anakapalli",
    "Ananthapuramu",
    "Annamayya",
    "Bapatla",
    "Chittoor",
    "Dr. B.R. Ambedkar Konaseema",
    "East Godavari",
    "Eluru",
    "Guntur",
    "Kakinada",
    "Krishna",
    "Kurnool",
    "Markapuram",
    "Nandyal",
    "NTR",
    "Palnadu",
    "Parvathipuram Manyam",
    "Prakasam",
    "Sri Potti Sriramulu Nellore",
    "Sri Sathya Sai",
    "Srikakulam",
    "Tirupati",
    "Visakhapatnam",
    "Vizianagaram",
    "West Godavari",
    "YSR Kadapa",
  ],
};


/* =========================================================
   COMPONENT
========================================================= */

function Register() {

  /* =======================================================
     REGISTRATION MODE
  ======================================================= */

  const [registrationMode, setRegistrationMode] = useState(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    return params.get("continue") === "existing"
      ? "existing"
      : "new";
  });


  /* =======================================================
     CURRENT STEP
  ======================================================= */

  const [currentStep, setCurrentStep] = useState(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    if (params.get("continue") === "existing") {
      return 1;
    }

    const savedStep = localStorage.getItem(
      "rangavallika_current_step"
    );

    return savedStep
      ? Number(savedStep)
      : 1;
  });


  /* =======================================================
     PARTICIPANT DETAILS
  ======================================================= */

  const [fullName, setFullName] =
    useState("");

  const [mobile, setMobile] =
    useState("");

  const [dob, setDob] =
    useState("");

  const [state, setState] =
    useState("");

  const [district, setDistrict] =
    useState("");

  const [pincode, setPincode] =
    useState("");

  const [address, setAddress] =
    useState("");


  /* =======================================================
     PARTICIPANT PHOTO
  ======================================================= */

  const [photo, setPhoto] =
    useState(null);

  const [photoPreview, setPhotoPreview] =
    useState("");


  /* =======================================================
     EXISTING REGISTRATION RECOVERY
  ======================================================= */

  const [
    recoveryRegistrationId,
    setRecoveryRegistrationId,
  ] = useState("");

  const [
    recoveryPin,
    setRecoveryPin,
  ] = useState("");

  const [
    recoveringRegistration,
    setRecoveringRegistration,
  ] = useState(false);

  const [
    recoveryError,
    setRecoveryError,
  ] = useState("");


  /* =======================================================
     REGISTRATION FEE
  ======================================================= */

  const [selectedPackage, setSelectedPackage] =
    useState(() => {

      try {

        const savedRegistration =
          localStorage.getItem(
            "rangavallika_registration"
          );

        if (!savedRegistration) {
          return null;
        }

        const saved =
          JSON.parse(savedRegistration);

        const savedAmount =
          Number(
            saved.package_amount ??
            saved.amount ??
            BASE_REGISTRATION_FEE
          );

        let couponCode =
          saved.coupon_code ||
          null;

        let couponType =
          saved.coupon_type ||
          null;


        /*
          Restore coupon from amount if
          backend/localStorage does not contain
          coupon information.
        */

        if (!couponCode) {

          if (savedAmount === 899) {
            couponCode = "UDAYBHANU0246";
            couponType = "UDAYBHANU";
          }

          if (savedAmount === 799) {
            couponCode = "GTST0246";
            couponType = "GTST";
          }
        }


        return {
          name: "RANGAVALLIKA",
          package_name: "RANGAVALLIKA",

          amount: savedAmount,

          package_amount: savedAmount,

          base_amount:
            Number(
              saved.base_amount ??
              BASE_REGISTRATION_FEE
            ),

          coupon_code: couponCode,

          coupon_type: couponType,
        };

      } catch (error) {

        console.error(
          "Failed to restore registration fee:",
          error
        );

        return null;
      }
    });


  /* =======================================================
     REGISTRATION
  ======================================================= */

  const [registration, setRegistration] =
    useState(() => {

      try {

        const savedRegistration =
          localStorage.getItem(
            "rangavallika_registration"
          );

        return savedRegistration
          ? JSON.parse(savedRegistration)
          : null;

      } catch (error) {

        console.error(
          "Failed to restore registration:",
          error
        );

        return null;
      }
    });


  /* =======================================================
     SAVE STEP
  ======================================================= */

  useEffect(() => {

    const params = new URLSearchParams(
      window.location.search
    );

    if (
      params.get("continue") === "existing"
    ) {
      return;
    }

    localStorage.setItem(
      "rangavallika_current_step",
      String(currentStep)
    );

  }, [currentStep]);


  /* =======================================================
     SAVE REGISTRATION
  ======================================================= */

  useEffect(() => {

    if (registration) {

      localStorage.setItem(
        "rangavallika_registration",
        JSON.stringify(registration)
      );
    }

  }, [registration]);


  /* =======================================================
     CREATING REGISTRATION
  ======================================================= */

  const [
    creatingRegistration,
    setCreatingRegistration,
  ] = useState(false);


  /* =======================================================
     MOBILE
  ======================================================= */

  const handleMobileChange = (e) => {

    const value =
      e.target.value
        .replace(/\D/g, "")
        .slice(0, 10);

    setMobile(value);
  };


  /* =======================================================
     PHOTO
  ======================================================= */

  const handlePhotoChange = (e) => {

    const file =
      e.target.files?.[0];

    if (!file) {
      return;
    }


    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];


    if (
      !allowedTypes.includes(
        file.type
      )
    ) {

      alert(
        "Please upload a JPG, PNG or WEBP image."
      );

      e.target.value = "";

      return;
    }


    if (
      file.size >
      5 * 1024 * 1024
    ) {

      alert(
        "Photo must be smaller than 5 MB."
      );

      e.target.value = "";

      return;
    }


    setPhoto(file);


    const preview =
      URL.createObjectURL(file);

    setPhotoPreview(preview);
  };


  /* =======================================================
     PINCODE
  ======================================================= */

  const handlePincodeChange = (e) => {

    const value =
      e.target.value
        .replace(/\D/g, "")
        .slice(0, 6);

    setPincode(value);
  };


  /* =======================================================
     RECOVERY PIN
  ======================================================= */

  const handleRecoveryPinChange = (e) => {

    const value =
      e.target.value
        .replace(/\D/g, "")
        .slice(0, 6);

    setRecoveryPin(value);

    setRecoveryError("");
  };
const initiateEasebuzzPayment = async (registrationId) => {
  if (!registrationId) {
    throw new Error("Registration ID is missing.");
  }

  console.log(
    "STARTING DIRECT EASEBUZZ PAYMENT...",
    registrationId
  );

  const paymentResponse = await fetch(
    `${API_URL}/api/payment/easebuzz/initiate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        registration_id: registrationId,
      }),
    }
  );

  const paymentResult =
    await paymentResponse.json();

  console.log(
    "EASEBUZZ RESPONSE:",
    paymentResult
  );

  if (
    !paymentResponse.ok ||
    !paymentResult.success ||
    !paymentResult.payment_url
  ) {
    throw new Error(
      paymentResult.message ||
      "Unable to start Easebuzz payment."
    );
  }

  const paymentTarget =
    String(paymentResult.payment_url).trim();

  const easebuzzCheckoutUrl =
    /^https?:\/\//i.test(paymentTarget)
      ? paymentTarget
      : `https://pay.easebuzz.in/pay/${paymentTarget.replace(
          /^\/+/,
          ""
        )}`;

  console.log(
    "REDIRECTING TO EASEBUZZ:",
    easebuzzCheckoutUrl
  );

  window.location.assign(
    easebuzzCheckoutUrl
  );
};

  /* =======================================================
     RECOVER EXISTING REGISTRATION
  ======================================================= */
  /* =======================================================
     RECOVER EXISTING REGISTRATION
  ======================================================= */

  const handleRecoverRegistration = async (e) => {
    e.preventDefault();

    setRecoveryError("");
    setRecoveringRegistration(true);

    try {
      const registrationId =
        recoveryRegistrationId.trim();

      const recoveryPinValue =
        recoveryPin.trim();

      if (!registrationId) {
        throw new Error(
          "Please enter your registration number."
        );
      }

      if (!/^\d{6}$/.test(recoveryPinValue)) {
        throw new Error(
          "Recovery PIN must be a 6-digit number."
        );
      }

      const response = await fetch(
        `${API_URL}/api/registration/recover`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            registration_id: registrationId,
            recovery_pin: recoveryPinValue,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
          "Unable to recover your registration."
        );
      }

      const recoveredRegistration =
        result.registration;

      if (!recoveredRegistration) {
        throw new Error(
          "Registration details were not returned."
        );
      }

      localStorage.setItem(
        "rangavallika_registration",
        JSON.stringify(recoveredRegistration)
      );

      localStorage.setItem(
        "rangavallika_registration_id",
        recoveredRegistration.registration_id ||
        registrationId
      );

      localStorage.setItem(
        "rangavallika_recovery_pin",
        recoveryPinValue
      );

      const recoveredAmount =
        Number(
          recoveredRegistration.package_amount ??
          recoveredRegistration.amount ??
          BASE_REGISTRATION_FEE
        );

      let recoveredCouponCode =
        recoveredRegistration.coupon_code || null;

      let recoveredCouponType =
        recoveredRegistration.coupon_type || null;

      if (!recoveredCouponCode && recoveredAmount === 899) {
        recoveredCouponCode = "UDAYBHANU0246";
        recoveredCouponType = "SUMA";
      }

      if (!recoveredCouponCode && recoveredAmount === 799) {
        recoveredCouponCode = "GTST0246";
        recoveredCouponType = "GTST";
      }

      const recoveredPackage = {
        name:
          recoveredRegistration.package_name ||
          "RANGAVALLIKA",

        package_name:
          recoveredRegistration.package_name ||
          "RANGAVALLIKA",

        amount: recoveredAmount,

        package_amount: recoveredAmount,

        base_amount:
          Number(
            recoveredRegistration.base_amount ??
            BASE_REGISTRATION_FEE
          ),

        coupon_code: recoveredCouponCode,

        coupon_type: recoveredCouponType,
      };

      setRegistrationMode("existing");

      setRegistration({
        ...recoveredRegistration,
        amount: recoveredAmount,
        package_amount: recoveredAmount,
        base_amount:
          Number(
            recoveredRegistration.base_amount ??
            BASE_REGISTRATION_FEE
          ),
        coupon_code: recoveredCouponCode,
        coupon_type: recoveredCouponType,
      });

      setSelectedPackage(recoveredPackage);

      window.history.replaceState(
  {},
  document.title,
  "/register"
);

await initiateEasebuzzPayment(
  recoveredRegistration.registration_id ||
  registrationId
);

return;

    } catch (error) {
      console.error(
        "RECOVERY ERROR:",
        error
      );

      setRecoveryError(
        error.message ||
        "Unable to recover your registration."
      );

    } finally {
      setRecoveringRegistration(false);
    }
  };

  /* =======================================================
     STEP 1
  ======================================================= */

  const handleParticipantSubmit =
    (e) => {

      e.preventDefault();


      if (!fullName.trim()) {

        alert(
          "Please enter your full name."
        );

        return;
      }


      if (
        !/^\d{10}$/.test(mobile)
      ) {

        alert(
          "Please enter a valid 10-digit mobile number."
        );

        return;
      }


      if (!dob) {

        alert(
          "Please select your date of birth."
        );

        return;
      }


      if (!state) {

        alert(
          "Please select your state."
        );

        return;
      }


      if (!district) {

        alert(
          "Please select your district."
        );

        return;
      }


      if (
        !/^\d{6}$/.test(pincode)
      ) {

        alert(
          "Please enter a valid 6-digit pincode."
        );

        return;
      }


      if (!address.trim()) {

        alert(
          "Please enter your complete address."
        );

        return;
      }


      if (!photo) {

        alert(
          "Please upload your photo."
        );

        return;
      }


      setCurrentStep(2);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };


  /* =======================================================
     STEP 2 → REGISTRATION FEE
  ======================================================= */

  const handlePackageContinue =
    (feeData) => {

      console.log(
        "REGISTRATION FEE DATA:",
        feeData
      );


      if (!feeData) {

        alert(
          "Please select a registration fee."
        );

        return;
      }


      const amount =
        Number(
          feeData.amount ??
          feeData.package_amount ??
          0
        );


      /*
        IMPORTANT:
        Only these amounts are valid.
      */

      if (
        !VALID_REGISTRATION_AMOUNTS.includes(
          amount
        )
      ) {

        alert(
          "Invalid registration amount."
        );

        return;
      }


      const couponCode =
        feeData.coupon_code ||
        null;


      const couponType =
        feeData.coupon_type ||
        null;


      /*
        If a coupon exists, make sure
        the amount matches the coupon.
      */

      if (couponCode) {

        const coupon =
          COUPONS[couponCode];


        if (!coupon) {

          alert(
            "Invalid coupon selected."
          );

          return;
        }


        if (
          amount !== coupon.amount
        ) {

          alert(
            "Invalid coupon amount."
          );

          return;
        }
      }


      const finalFeeData = {

        name:
          "RANGAVALLIKA",

        package_name:
          "RANGAVALLIKA",

        amount,

        package_amount:
          amount,

        base_amount:
          BASE_REGISTRATION_FEE,

        coupon_code:
          couponCode,

        coupon_type:
          couponType,
      };


      setSelectedPackage(
        finalFeeData
      );


      setCurrentStep(3);


      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };


  /* =======================================================
     GET REGISTRATION AMOUNT
  ======================================================= */

  const getPackageAmount =
    (pkg) => {

      if (!pkg) {
        return 0;
      }


      const rawAmount =
        pkg.amount ??
        pkg.package_amount ??
        pkg.price ??
        pkg.packagePrice ??
        0;


      const cleanedAmount =
        String(rawAmount)
          .replace(/[^\d.]/g, "");


      const amount =
        Number(cleanedAmount);


      return Number.isFinite(amount)
        ? amount
        : 0;
    };


  /* =======================================================
     STEP 3 → CREATE REGISTRATION
  ======================================================= */

  const handlePayment =
    async () => {

      if (creatingRegistration) {
        return;
      }


      if (!selectedPackage) {

        alert(
          "Please select a registration fee."
        );

        setCurrentStep(2);

        return;
      }


      const packageName =
        String(
          selectedPackage.name ||
          selectedPackage.package_name ||
          selectedPackage.packageName ||
          "RANGAVALLIKA"
        )
          .trim()
          .toUpperCase();


      const packageAmount =
        getPackageAmount(
          selectedPackage
        );


      const couponCode =
        selectedPackage.coupon_code ||
        null;


      const couponType =
        selectedPackage.coupon_type ||
        null;


      console.log(
        "================================"
      );

      console.log(
        "CREATING REGISTRATION"
      );

      console.log(
        "Registration:",
        selectedPackage
      );

      console.log(
        "Package Name:",
        packageName
      );

      console.log(
        "Final Amount:",
        packageAmount
      );

      console.log(
        "Coupon:",
        couponCode
      );

      console.log(
        "================================"
      );


      /* -----------------------------------------------
         VALIDATE AMOUNT
      ------------------------------------------------ */

      if (
        !VALID_REGISTRATION_AMOUNTS.includes(
          packageAmount
        )
      ) {

        alert(
          "Invalid registration amount."
        );

        setCurrentStep(2);

        return;
      }


      /* -----------------------------------------------
         VALIDATE COUPON
      ------------------------------------------------ */

      if (couponCode) {

        const coupon =
          COUPONS[couponCode];


        if (!coupon) {

          alert(
            "Invalid coupon selected."
          );

          setCurrentStep(2);

          return;
        }


        if (
          packageAmount !==
          coupon.amount
        ) {

          alert(
            "Invalid coupon amount."
          );

          setCurrentStep(2);

          return;
        }
      }


      /* -----------------------------------------------
         PARTICIPANT VALIDATION
      ------------------------------------------------ */

      if (!fullName.trim()) {

        alert(
          "Please enter your full name."
        );

        setCurrentStep(1);

        return;
      }


      if (
        !/^\d{10}$/.test(mobile)
      ) {

        alert(
          "Please enter a valid 10-digit mobile number."
        );

        setCurrentStep(1);

        return;
      }


      if (!dob) {

        alert(
          "Please select your date of birth."
        );

        setCurrentStep(1);

        return;
      }


      if (!state) {

        alert(
          "Please select your state."
        );

        setCurrentStep(1);

        return;
      }


      if (!district) {

        alert(
          "Please select your district."
        );

        setCurrentStep(1);

        return;
      }


      if (
        !/^\d{6}$/.test(pincode)
      ) {

        alert(
          "Please enter a valid 6-digit pincode."
        );

        setCurrentStep(1);

        return;
      }


      if (!address.trim()) {

        alert(
          "Please enter your complete address."
        );

        setCurrentStep(1);

        return;
      }


      if (!photo) {

        alert(
          "Please upload your participant photo."
        );

        setCurrentStep(1);

        return;
      }


      /* -----------------------------------------------
         CREATE REGISTRATION
      ------------------------------------------------ */

      try {

        setCreatingRegistration(
          true
        );


        const formData =
          new FormData();


        formData.append(
          "full_name",
          fullName.trim()
        );


        formData.append(
          "mobile",
          mobile.trim()
        );


        formData.append(
          "dob",
          dob
        );


        formData.append(
          "state",
          state.trim()
        );


        formData.append(
          "district",
          district.trim()
        );


        formData.append(
          "pincode",
          pincode.trim()
        );


        formData.append(
          "address",
          address.trim()
        );


        /*
          New registration fee structure
        */

        formData.append(
          "package_name",
          packageName
        );


        formData.append(
          "package_amount",
          String(packageAmount)
        );


        /*
          Coupon information
        */

        formData.append(
          "coupon_code",
          couponCode || ""
        );


        formData.append(
          "coupon_type",
          couponType || ""
        );


        formData.append(
          "base_amount",
          String(
            BASE_REGISTRATION_FEE
          )
        );


        /*
          Participant photo
        */

        formData.append(
          "participant_photo",
          photo
        );


        console.log(
          "SENDING REGISTRATION TO BACKEND..."
        );


        const response =
          await fetch(
            `${API_URL}/api/registration/create`,
            {
              method: "POST",
              body: formData,
            }
          );


        const result =
          await response.json();


        console.log(
          "CREATE REGISTRATION RESPONSE:",
          result
        );


        if (
          !response.ok ||
          !result.success
        ) {

          throw new Error(
            result.message ||
            "Unable to create registration."
          );
        }


        /* -----------------------------------------------
           CREATED REGISTRATION
        ------------------------------------------------ */

        const createdRegistration =
          result.registration;


        /*
          Ensure frontend keeps the final
          amount and coupon information even
          if backend doesn't return them.
        */

        const finalRegistration = {

          ...createdRegistration,

          package_name:
            createdRegistration.package_name ||
            packageName,

          package_amount:
            Number(
              createdRegistration.package_amount ??
              packageAmount
            ),

          amount:
            Number(
              createdRegistration.package_amount ??
              packageAmount
            ),

          base_amount:
            BASE_REGISTRATION_FEE,

          coupon_code:
            createdRegistration.coupon_code ||
            couponCode,

          coupon_type:
            createdRegistration.coupon_type ||
            couponType,
        };


        setRegistration(
          finalRegistration
        );


        setSelectedPackage({

          name:
            finalRegistration.package_name,

          package_name:
            finalRegistration.package_name,

          amount:
            Number(
              finalRegistration.package_amount
            ),

          package_amount:
            Number(
              finalRegistration.package_amount
            ),

          base_amount:
            BASE_REGISTRATION_FEE,

          coupon_code:
            finalRegistration.coupon_code ||
            couponCode,

          coupon_type:
            finalRegistration.coupon_type ||
            couponType,
        });


        /* -----------------------------------------------
           LOCAL STORAGE
        ------------------------------------------------ */

        localStorage.setItem(
          "rangavallika_registration",
          JSON.stringify(
            finalRegistration
          )
        );


        localStorage.setItem(
          "rangavallika_registration_id",
          finalRegistration.registration_id
        );


        if (
          finalRegistration.recovery_pin
        ) {

          localStorage.setItem(
            "rangavallika_recovery_pin",
            finalRegistration.recovery_pin
          );
        }


        /* -----------------------------------------------
           PAYMENT STEP
        ------------------------------------------------ */
/* -----------------------------------------------
   DIRECT EASEBUZZ PAYMENT
------------------------------------------------ */

console.log("STARTING DIRECT EASEBUZZ PAYMENT...");

const paymentResponse = await fetch(
  `${API_URL}/api/payment/easebuzz/initiate`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      registration_id:
        finalRegistration.registration_id,
    }),
  }
);

const paymentResult =
  await paymentResponse.json();

console.log(
  "EASEBUZZ RESPONSE:",
  paymentResult
);

if (
  !paymentResponse.ok ||
  !paymentResult.success ||
  !paymentResult.payment_url
) {
  throw new Error(
    paymentResult.message ||
      "Unable to start Easebuzz payment."
  );
}

const paymentTarget =
  String(
    paymentResult.payment_url
  ).trim();

const easebuzzCheckoutUrl =
  /^https?:\/\//i.test(paymentTarget)
    ? paymentTarget
    : `https://pay.easebuzz.in/pay/${paymentTarget.replace(
        /^\/+/,
        ""
      )}`;

console.log(
  "REDIRECTING TO EASEBUZZ:",
  easebuzzCheckoutUrl
);

window.location.assign(
  easebuzzCheckoutUrl
);

return;

      } catch (error) {

        console.error(
          "REGISTRATION ERROR:",
          error
        );


        alert(
          error.message ||
          "Unable to create registration. Please try again."
        );

      } finally {

        setCreatingRegistration(
          false
        );
      }
    };


  /* =======================================================
     PAYMENT COMPLETE
  ======================================================= */

  const handlePaymentComplete =
    (updatedRegistration) => {

      console.log(
        "PAYMENT SCREENSHOT SUBMITTED:",
        updatedRegistration
      );


      setRegistration(
        updatedRegistration
      );
    };


  /* =======================================================
     EXISTING REGISTRATION SCREEN
  ======================================================= */

  if (
    registrationMode === "existing" &&
    currentStep !== 4
  ) {

    return (
      <div className="register-page">

        {/* HEADER */}

        <header className="register-topbar">

          <a
            href="/#home"
            className="register-brand"
          >
            <img
              src="/give.png"
              alt="Give Laurels Foundation of India"
            />
          </a>


          <a
            href="/#home"
            className="top-home-button"
          >
            <span>←</span>
            Back to Home
          </a>

        </header>


        {/* TITLE */}

        <section className="register-intro">

          <h1>
            Rangavallika
          </h1>

          <div className="register-now">
            CONTINUE{" "}
            <strong>
              REGISTRATION
            </strong>
          </div>

        </section>


        {/* RECOVERY CARD */}

        <main className="register-card">

          <div className="participant-heading">

            <div className="participant-title">

              <h2>
                Continue Existing Registration
              </h2>

              <p>
                Enter your Registration ID and
                Recovery PIN to continue.
              </p>

            </div>

          </div>


          <form
            className="registration-form"
            onSubmit={
              handleRecoverRegistration
            }
          >

            <div className="register-grid">

              {/* REGISTRATION ID */}

              <div className="register-field">

                <label>
                  Registration ID{" "}
                  <span>*</span>
                </label>

                <div className="field-box">

                  <input
                    type="text"
                    placeholder="Enter your Registration ID"
                    value={
                      recoveryRegistrationId
                    }
                    onChange={(e) => {

                      setRecoveryRegistrationId(
                        e.target.value
                      );

                      setRecoveryError("");
                    }}
                    autoComplete="off"
                    required
                  />

                </div>

              </div>


              {/* RECOVERY PIN */}

              <div className="register-field">

                <label>
                  Recovery PIN{" "}
                  <span>*</span>
                </label>

                <div className="field-box">

                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter 6-digit Recovery PIN"
                    value={recoveryPin}
                    onChange={
                      handleRecoveryPinChange
                    }
                    maxLength={6}
                    autoComplete="off"
                    required
                  />

                  <small className="counter">
                    {recoveryPin.length}/6
                  </small>

                </div>

              </div>

            </div>


            {/* INFORMATION */}

            <div className="before-continue">

              <h3>
                Continue your registration
              </h3>

              <p>
                Use the Registration ID and
                Recovery PIN provided to you
                during registration. Your existing
                registration details and payment
                status will be restored.
              </p>

            </div>


            {/* ERROR */}

            {recoveryError && (

              <div
                style={{
                  marginTop: "20px",
                  padding: "14px 18px",
                  borderRadius: "12px",
                  background: "#fff1f1",
                  color: "#b42318",
                  border:
                    "1px solid #f3b5b5",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                ⚠️ {recoveryError}
              </div>

            )}


            {/* BUTTONS */}

            <div className="register-actions">

              <a
                href="/#home"
                className="back-button"
              >
                <span>←</span>
                Back to Home
              </a>


              <button
                type="submit"
                className="continue-button"
                disabled={
                  recoveringRegistration
                }
              >

                {recoveringRegistration
                  ? "Checking..."
                  : "Continue Registration"}

                {!recoveringRegistration && (
                  <span>→</span>
                )}

              </button>

            </div>

          </form>

        </main>

      </div>
    );
  }


  /* =======================================================
     STEP 2 — REGISTRATION FEE
  ======================================================= */

  if (
    currentStep === 2
  ) {

    return (
      <CompetitionDetails

        onPrevious={() =>
          setCurrentStep(1)
        }

        onContinue={
          handlePackageContinue
        }

      />
    );
  }


  /* =======================================================
     STEP 3 — REVIEW
  ======================================================= */

  if (
    currentStep === 3
  ) {

    return (
     <ReviewSubmit

  participant={{
    fullName,
    mobile,
    dob,
    state,
    district,
    pincode,
    address,
    photo,
    photoPreview,
  }}

  selectedPackage={
    selectedPackage
  }

  onPrevious={() =>
    setCurrentStep(2)
  }

  onEditParticipant={() =>
    setCurrentStep(1)
  }

  onEditPackage={() =>
    setCurrentStep(2)
  }

  onPayment={
    handlePayment
  }

  loading={
    creatingRegistration
  }

/>
    );
  }


  /* =======================================================
     STEP 4 — PAYMENT
  ======================================================= */

  if (currentStep === 4) {
    return (
      <Payment
        registrationId={
          registration?.registration_id
        }
        registration={
          registration
        }
        selectedPackage={
          selectedPackage
        }
        isExistingRegistration={
          registrationMode === "existing"
        }
        onBack={() =>
          setCurrentStep(3)
        }
        onHome={() => {
          window.location.href = "/";
        }}
      />
    );
  }


  /* =======================================================
     STEP 1 — NEW REGISTRATION
  ======================================================= */

  return (
    <div className="register-page">

      {/* HEADER */}

      <header className="register-topbar">

        <a
          href="/#home"
          className="register-brand"
        >
          <img
            src="/give.png"
            alt="Give Laurels Foundation of India"
          />
        </a>


        <a
          href="/#home"
          className="top-home-button"
        >
          <span>←</span>
          Back to Home
        </a>

      </header>


      {/* TITLE */}

      <section className="register-intro">

        <h1>
          Rangavallika
        </h1>

        <div className="register-now">

          REGISTER{" "}

          <strong>
            NOW
          </strong>

        </div>

      </section>


      {/* PROGRESS */}

      <section className="register-progress">

        <div className="progress-step active">

          <div className="progress-circle">
            1
          </div>

          <strong>
            Participant Details
          </strong>

          <span>
            Your Information
          </span>

        </div>


        <div className="progress-line active-line"></div>


        <div className="progress-step">

          <div className="progress-circle">
            2
          </div>

          <strong>
            Registration Fee
          </strong>

          <span>
            Select fee &amp; offer
          </span>

        </div>


        <div className="progress-line"></div>


        <div className="progress-step">

          <div className="progress-circle">
            3
          </div>

          <strong>
            Review &amp; Submit
          </strong>

          <span>
            Confirm Application
          </span>

        </div>

      </section>


      {/* MAIN CARD */}

      <main className="register-card">

        <div className="participant-heading">

          <div className="participant-title">

            <h2>
              Participant Details
            </h2>

            <p>
              Please enter your details carefully.
            </p>

          </div>


          <span className="mandatory-text">

            All fields marked{" "}

            <b>*</b>

            {" "}are mandatory.

          </span>

        </div>


        <form
          className="registration-form"
          onSubmit={
            handleParticipantSubmit
          }
        >

          <div className="register-grid">

            {/* DATE OF BIRTH */}

            <div className="register-field">

              <label>
                Date of Birth{" "}
                <span>*</span>
              </label>

              <div className="field-box">

                <input
                  type="date"
                  value={dob}
                  onChange={(e) =>
                    setDob(
                      e.target.value
                    )
                  }
                  required
                />

              </div>

            </div>


            {/* FULL NAME */}

            <div className="register-field">

              <label>
                Full Name{" "}
                <span>*</span>
              </label>

              <div className="field-box">

                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) =>
                    setFullName(
                      e.target.value
                    )
                  }
                  required
                />

              </div>

            </div>


            {/* MOBILE */}

            <div className="register-field">

              <label>
                Mobile Number{" "}
                <span>*</span>
              </label>

              <div className="field-box">

                <input
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={mobile}
                  onChange={
                    handleMobileChange
                  }
                  maxLength={10}
                  inputMode="numeric"
                  required
                />

                <small className="counter">
                  {mobile.length}/10
                </small>

              </div>

            </div>


            {/* STATE */}

            <div className="register-field">

              <label>
                State{" "}
                <span>*</span>
              </label>

              <div className="field-box">

                <select
                  value={state}
                  onChange={(e) => {

                    setState(
                      e.target.value
                    );

                    setDistrict("");
                  }}
                  required
                >

                  <option value="">
                    Select your state
                  </option>

                  <option value="Telangana">
                    Telangana
                  </option>

                  <option value="Andhra Pradesh">
                    Andhra Pradesh
                  </option>

                </select>

                <span className="select-arrow">
                  ⌄
                </span>

              </div>

            </div>


            {/* DISTRICT */}

            <div className="register-field">

              <label>
                District{" "}
                <span>*</span>
              </label>

              <div className="field-box">

                <select
                  value={district}
                  onChange={(e) =>
                    setDistrict(
                      e.target.value
                    )
                  }
                  disabled={!state}
                  required
                >

                  <option value="">
                    {state
                      ? "Select your district"
                      : "Select state first"}
                  </option>

                  {state &&
                    districts[state]?.map(
                      (item) => (

                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>

                      )
                    )}

                </select>

                <span className="select-arrow">
                  ⌄
                </span>

              </div>

            </div>

          </div>


          {/* PINCODE */}

          <div className="register-field pincode-field">

            <label>
              Pincode{" "}
              <span>*</span>
            </label>

            <div className="field-box">

              <input
                type="text"
                placeholder="Enter 6-digit pincode"
                value={pincode}
                onChange={
                  handlePincodeChange
                }
                maxLength={6}
                inputMode="numeric"
                required
              />

              <small className="counter">
                {pincode.length}/6
              </small>

            </div>

          </div>


          {/* ADDRESS + PHOTO */}

          <div className="lower-form-grid">

            {/* ADDRESS */}

            <div className="register-field address-field">

              <label>
                Complete Address{" "}
                <span>*</span>
              </label>

              <div className="field-box textarea-box">

                <textarea
                  placeholder="Enter your complete address"
                  value={address}
                  onChange={(e) =>
                    setAddress(
                      e.target.value
                    )
                  }
                  maxLength={200}
                  rows={4}
                  required
                />

                <small className="address-counter">
                  {address.length}/200
                </small>

              </div>

            </div>


            {/* PHOTO */}

            <div className="register-field photo-field">

              <label>
                Upload Your Photo{" "}
                <span>*</span>
              </label>

              <div
                className={`photo-upload-box ${
                  photo
                    ? "photo-selected"
                    : ""
                }`}
                onClick={() =>
                  document
                    .getElementById(
                      "participant-photo"
                    )
                    .click()
                }
              >

                <input
                  id="participant-photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={
                    handlePhotoChange
                  }
                  hidden
                />

                {!photo ? (

                  <div className="photo-upload-content">

                    <div className="photo-upload-icon">
                      ↑
                    </div>

                    <h4>
                      Drag &amp; drop your photo here
                    </h4>

                    <p>
                      or{" "}
                      <span>
                        click to browse
                      </span>
                    </p>

                    <small>
                      JPG, PNG, WEBP (Max 5MB)
                    </small>

                  </div>

                ) : (

                  <div className="photo-preview-content">

                    <img
                      src={photoPreview}
                      alt="Participant preview"
                      className="participant-photo-preview"
                    />

                    <div className="photo-preview-info">

                      <strong>
                        Photo selected ✓
                      </strong>

                      <p>
                        {photo.name}
                      </p>

                      <button
                        type="button"
                        className="change-photo-button"
                        onClick={(e) => {

                          e.stopPropagation();

                          document
                            .getElementById(
                              "participant-photo"
                            )
                            .click();
                        }}
                      >
                        Change Photo
                      </button>

                    </div>

                  </div>

                )}

              </div>

              <p className="photo-required-note">
                Please upload a clear, recent passport-size photo.
              </p>

            </div>

          </div>


          {/* BEFORE CONTINUE */}

          <div className="before-continue">

            <h3>
              Before you continue
            </h3>

            <p>
              Please make sure all the
              information entered above is
              correct. You can review your
              details in the next step.
            </p>

          </div>


          {/* BUTTONS */}

          <div className="register-actions">

            <a
              href="/#home"
              className="back-button"
            >
              <span>←</span>
              Back to Home
            </a>


            <button
              type="submit"
              className="continue-button"
            >
              Continue to Next Step
              <span>→</span>
            </button>

          </div>

        </form>

      </main>

    </div>
  );
}


export default Register;
