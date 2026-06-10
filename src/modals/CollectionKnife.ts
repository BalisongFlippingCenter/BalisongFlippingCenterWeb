export interface GalleryFile {
  fileId: string;
  postId: string | null;
}

export interface CollectionKnifeDTO {
  id: string | null;
  displayName: string;
  knifeMaker: string;
  baseKnifeModel: string;
  knifeType: string;
  isFavoriteKnife: boolean;
  isFavoriteFlipper: boolean;
  aqquiredDate: string;
  coverPhoto: File;
  coverPhotoFileName: string;

  msrp: string;
  overallLength: string;
  weight: string;
  pivotSystem: string;
  latchType: string;
  pinSystem: string;
  hasModularBalance: boolean;
  balanceValue: number | null;

  bladeStyle: string;
  bladeFinish: string;
  bladeMaterial: string;

  handleConstruction: string;
  handleMaterial: string;
  handleFinish: string;

  averageScore: number | null;
  qualityScore: number;
  flippingScore: number;
  feelScore: number;
  soundScore: number;
  durabilityScore: number;
}

export interface CollectionKnife {
  id: string | null;
  collectionId: number | null;
  displayName: string;
  knifeMaker: string;
  baseKnifeModel: string;
  knifeType: string;
  favoriteKnife: boolean;
  favoriteFlipper: boolean;
  aqquiredDate: string;
  coverPhoto: string;
  galleryFiles: GalleryFile[] | null;

  msrp: string | number;
  overallLength: string;
  weight: string;
  pivotSystem: string;
  latchType: string;
  pinSystem: string;
  hasModularBalance: boolean;
  balanceValue: string | null;

  bladeStyle: string;
  bladeFinish: string;
  bladeMaterial: string;

  handleConstruction: string;
  handleMaterial: string;
  handleFinish: string;

  averageScore: number | null;
  qualityScore: number;
  flippingScore: number;
  feelScore: number;
  soundScore: number;
  durabilityScore: number;
}
