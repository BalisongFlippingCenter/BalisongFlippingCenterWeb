import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { axiosApiInstanceAuth } from "../../api/axios";
import { CollectionKnifeDTO } from "../../modals/CollectionKnife";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { Collection } from "../../modals/Collection";
import { setCollection } from "../../redux/collection/collectionSlice";
import { mapCollectionKnife } from "../../redux/collection/collectionActions";

interface params {
  galleryFiles: Array<File> | null;
  newKnifeObj: CollectionKnifeDTO | null;
  setStepManually: Function;
}

const NewCollectionKnifeSubmit = ({ galleryFiles, newKnifeObj }: params) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [_erorMsg, setErrorMsg] = useState("");

  const user = useAppSelector((state) => state.auth.user);
  const collectionData = useAppSelector((state) => state.collection.collection);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const validateNewKnifeObj = () => {
    return true;
  };

  const uploadNewKnife = async () => {
    const formData = new FormData();

    // Required fields
    formData.append("displayName", newKnifeObj?.displayName!);
    formData.append("knifeMaker", newKnifeObj?.knifeMaker!);
    formData.append("baseKnifeModel", newKnifeObj?.baseKnifeModel!);
    formData.append("knifeType", newKnifeObj?.knifeType!);
    formData.append("aqquiredDate", newKnifeObj?.aqquiredDate!);
    formData.append("coverPhoto", newKnifeObj?.coverPhoto!);

    // Optional fields
    formData.append("isFavoriteKnife", JSON.stringify(newKnifeObj?.isFavoriteKnife));
    formData.append("isFavoriteFlipper", JSON.stringify(newKnifeObj?.isFavoriteFlipper));
    formData.append("knifeMSRP", newKnifeObj?.msrp!);
    formData.append("overallLength", newKnifeObj?.overallLength!);
    formData.append("weight", newKnifeObj?.weight!);
    formData.append("pivotSystem", newKnifeObj?.pivotSystem!);
    formData.append("latchType", newKnifeObj?.latchType!);
    formData.append("pinSystem", newKnifeObj?.pinSystem!);
    formData.append("hasModularBalance", JSON.stringify(newKnifeObj?.hasModularBalance));
    if (newKnifeObj?.balanceValue !== null && newKnifeObj?.balanceValue !== undefined) {
      formData.append("balanceValue", String(newKnifeObj.balanceValue));
    }
    formData.append("bladeStyle", newKnifeObj?.bladeStyle!);
    formData.append("bladeFinish", newKnifeObj?.bladeFinish!);
    formData.append("bladeMaterial", newKnifeObj?.bladeMaterial!);
    formData.append("handleConstruction", newKnifeObj?.handleConstruction!);
    formData.append("handleMaterial", newKnifeObj?.handleMaterial!);
    formData.append("handleFinish", newKnifeObj?.handleFinish!);
    formData.append("qualityScore", JSON.stringify(newKnifeObj?.qualityScore));
    formData.append("flippingScore", JSON.stringify(newKnifeObj?.flippingScore));
    formData.append("feelScore", JSON.stringify(newKnifeObj?.feelScore));
    formData.append("soundScore", JSON.stringify(newKnifeObj?.soundScore));
    formData.append("durabilityScore", JSON.stringify(newKnifeObj?.durabilityScore));

    // Gallery images — only append if files are present
    if (galleryFiles && galleryFiles.length > 0) {
      galleryFiles.forEach((file) => formData.append("galleryFiles", file));
    }

    console.log("form data: ", formData);

    // post to api
    setIsLoading(true);
    await axiosApiInstanceAuth
      .request({
        url: "/collection/me/add-knife",
        method: "post",
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
        },
      })
      .then((res) => {
        const newCollectionData = {
          ...collectionData,
          collectedKnives: [...(collectionData?.collectedKnives ?? []), mapCollectionKnife(res.data)],
        } as Collection;
        dispatch(setCollection(newCollectionData));
      })
      .catch((err) => {
        console.log("adding new knife error", err);
        setIsError(true);
        setErrorMsg(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    // validate new knfie obj for backend
    if (!newKnifeObj || newKnifeObj === null || !validateNewKnifeObj()) {
      setIsError(true);
      setErrorMsg("Form Data Error");
    }

    // initate uploading of new knife obj
    if (!isError) {
      uploadNewKnife();
    }
  }, []);

  return (
    <section className="w-full pt-16 flex justify-center items-start px-6">
      <div className="w-full max-w-sm bg-[#13161d] border border-white/10 rounded-2xl p-8 flex flex-col items-center gap-5 text-center">
        {isError ? (
          <>
            <div className="w-14 h-14 rounded-full bg-red/10 border border-red/30 flex items-center justify-center">
              <span className="text-red text-2xl">✕</span>
            </div>
            <div>
              <h5 className="text-white font-bold text-lg">Upload Failed</h5>
              <p className="text-white/40 text-sm mt-1">Something went wrong. Please try again.</p>
            </div>
          </>
        ) : isLoading ? (
          <>
            <div className="w-14 h-14 rounded-full bg-blue-primary/10 border border-blue-primary/30 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-blue-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <div>
              <h5 className="text-white font-bold text-lg">Uploading</h5>
              <p className="text-white/40 text-sm mt-1">Adding your knife to the collection…</p>
            </div>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-full bg-green/10 border border-green/30 flex items-center justify-center">
              <span className="text-green text-2xl">✓</span>
            </div>
            <div>
              <h5 className="text-white font-bold text-lg">Knife Added!</h5>
              <p className="text-white/40 text-sm mt-1">Your knife has been added to your collection.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/${user?.displayName}/${user?.identifierCode}/collection`)}
              className="w-full py-3 rounded-xl bg-blue-primary text-white text-sm font-semibold hover:bg-blue-primary/80 transition-colors duration-200"
            >
              View Collection
            </button>
          </>
        )}
      </div>
    </section>
  );
};

export default NewCollectionKnifeSubmit;
