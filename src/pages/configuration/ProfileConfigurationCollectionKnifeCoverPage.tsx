import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import { useAppSelector } from "../../redux/hooks";
import CollectionKnifeCoverConfiguration from "../../components/accountConfigurationComponents/CollectionKnifeCoverConfiguration";

const ProfileConfigurationCollectionKnifeCoverPage = () => {
  const { knifeId } = useParams<{ knifeId: string }>();
  const navigate = useNavigate();

  const knife = useAppSelector((state) =>
    state.collection.collectionKnives.find((k) => String(k.id) === knifeId)
  );

  if (!knife || !knifeId) {
    return (
      <section className="w-full min-h-screen flex justify-center items-center bg-[#080a0e]">
        <p className="text-white/40 text-sm">Knife not found.</p>
      </section>
    );
  }

  return (
    <section className="w-full min-h-screen flex justify-center pb-28 pt-6 px-4 lg:pl-[192px] bg-[#080a0e]">
      <div className="w-full max-w-[480px] md:max-w-[640px] flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-colors duration-200"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
          </button>
          <div>
            <h1 className="text-white font-bold text-xl">Cover Photo</h1>
            <p className="text-white/40 text-sm">{knife.displayName}</p>
          </div>
        </div>

        <CollectionKnifeCoverConfiguration
          knifeId={knifeId}
          currentCoverPhoto={knife.coverPhoto ?? null}
          displayName={knife.displayName}
          galleryImages={knife.galleryFiles?.map((f) => f.fileId) ?? []}
        />

      </div>
    </section>
  );
};

export default ProfileConfigurationCollectionKnifeCoverPage;
