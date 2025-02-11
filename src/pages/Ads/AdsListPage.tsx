/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { format, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState, useEffect} from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, Carousel} from "flowbite-react";
// import { HiViewList, HiSearch } from "react-icons/hi";
// import { MdOutlineApps } from "react-icons/md";
// import MapButton from '../../components/Map/MapButton';
import { CiEdit } from "react-icons/ci";
import InfiniteScroll from 'react-infinite-scroll-component';
import { getAds, getAdById, getAdsByParams, getCategories, getSubCategories, getAdsByCategories, getAdsBySubCategories } from '../../services/api/ads';
// import { debounce } from '../../services/utils/debounce';
import { ThreeDots } from 'react-loader-spinner';
import Nouveau from '../../assets/nouveau.png';
import FixedHeader from '../../components/Header/FixedHeader';
/* import { GiFlexibleStar } from "react-icons/gi"; */

type Category = string;

const initialCategoryCounts: Record<Category, number> = {
    all: 0,
};

export default function AdsListPage({ searchQuery }: { searchQuery: string }) {
    const [localSearchQuery] = useState<string>('');
    const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
    const [isAllSelected, setIsAllSelected] = useState<boolean>(true);
    const [items, setItems] = useState<any[]>([]);
    const [hasMore, setHasMore] = useState(true);
    const [adsList, setAdsList] = useState<any[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoryCounts, setCategoryCounts] = useState(initialCategoryCounts);
    const [subCategories, setSubCategories] = useState<Record<Category, string[]>>({});
    const [role, setRole] = useState('');
    const { id } = useParams<{ id: string }>();

    console.log('categoryCounts', categoryCounts);
    console.log('role', role);


    useEffect(() => {
        const storedRole = localStorage.getItem('role');
        if (storedRole) {
            setRole(storedRole);
        }
    }, []);

    useEffect(() => {
        fetchAds();
        fetchCategories();
    }, []);

    useEffect(() => {
        if (id) {
            fetchAdDetails(id);
        }
    }, [id]);

    useEffect(() => {
        fetchFilteredAds();
    }, [selectedCategories, localSearchQuery, searchQuery]);

    const fetchAds = async () => {
        const ads = await getAds();
        setAdsList(ads);
        updateCategoryCounts(ads);
        fetchInitialItems(ads);
    };

    const fetchFilteredAds = async () => {
        try {
            const query = localSearchQuery || searchQuery || '';
            let response;

            if (isAllSelected || selectedCategories.length === 0) {
                response = await getAdsByParams(query);
            } else {
                const categoryAds = await Promise.all(
                    selectedCategories.map(category => getAdsByCategories(category))
                );
                const ads = categoryAds.flatMap(category => category.data.ads);
                response = { data: { ads } };
            }

            if (!response || !response.data || !Array.isArray(response.data.ads)) {
                console.error(`Erreur: réponse inattendue ou liste d'annonces manquante`, response);
                return;
            }

            const fetchedAds = response.data.ads;
            setItems(fetchedAds.slice(0, 12));
            setHasMore(fetchedAds.length > 12);
        } catch (error) {
            console.error('Erreur lors de la récupération des annonces:', error);
        }
    };

    const fetchInitialItems = (ads: any[]) => {
        const filteredAds = ads.filter((ad) => {
            const matchesCategory =
                isAllSelected || selectedCategories.length === 0 || selectedCategories.includes(ad.category as Category);
            const matchesSearchQuery =
                !localSearchQuery ||
                ad.title.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
                ad.city.toLowerCase().includes(localSearchQuery.toLowerCase());
            return matchesCategory && matchesSearchQuery;
        });

        setItems(filteredAds.slice(0, 12));
        setHasMore(filteredAds.length > 12);
    };

    const handleCategoryChange = async (category: Category) => {
        if (category === 'all') {
            setSelectedCategories([]);
            setIsAllSelected(true);
        } else {
            setIsAllSelected(false);
            setSelectedCategories((prevCategories) =>
                prevCategories.includes(category)
                    ? prevCategories.filter((c) => c !== category)
                    : [...prevCategories, category]
            );
        }

        await fetchFilteredAds();
    };

    const handleSubCategoryChange = async (subCategory: string) => {
        try {
            const response = await getAdsBySubCategories(subCategory);
            if (!response || !response.data || !Array.isArray(response.data.ads)) {
                console.error(`Erreur: réponse inattendue ou liste d'annonces manquante pour la sous-catégorie ${subCategory}`, response);
                return;
            }
    
            const fetchedAds = response.data.ads;

            setItems(fetchedAds.slice(0, 12));
            setHasMore(fetchedAds.length > 12);
        } catch (error) {
            console.error(`Erreur lors de la récupération des annonces pour la sous-catégorie ${subCategory}:`, error);
        }
    };

    const handleCategoryHover = async (category: Category) => {
        if (category === 'all') {
            setSubCategories((prevSubCategories) => ({
                ...prevSubCategories,
                [category]: [], // No sub-categories for 'all'
            }));
            return;
        }

        try {
            const response = await getSubCategories(category);
            if (response && response.data && Array.isArray(response.data.subCategories)) {
                setSubCategories((prevSubCategories) => ({
                    ...prevSubCategories,
                    [category]: response.data.subCategories,
                }));
            } else {
                console.warn(`Réponse inattendue pour les sous-catégories de la catégorie ${category}:`, response);
                setSubCategories((prevSubCategories) => ({
                    ...prevSubCategories,
                    [category]: [],
                }));
            }
        } catch (error) {
            console.error(`Erreur lors de la récupération des sous-catégories de la catégorie ${category}:`, error);
            setSubCategories((prevSubCategories) => ({
                ...prevSubCategories,
                [category]: [],
            }));
        }
    };

    // const debouncedHandleSearchChange = useCallback(debounce((query: string) => {
    //     setLocalSearchQuery(query);
    // }, 500), []);

    // const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    //     const { value } = event.target;
    //     debouncedHandleSearchChange(value);
    // };

    const fetchMoreData = () => {
        const currentLength = items.length;
        const filteredAds = adsList.filter((ad) => {
            const matchesCategory =
                isAllSelected || selectedCategories.length === 0 || selectedCategories.includes(ad.category as Category);
            const matchesSearchQuery =
                !localSearchQuery ||
                ad.title.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
                ad.city.toLowerCase().includes(localSearchQuery.toLowerCase());
            return matchesCategory && matchesSearchQuery;
        });

        const nextBatch = filteredAds.slice(currentLength, currentLength + 12);
        if (nextBatch.length === 0) {
            setHasMore(false);
            return;
        }

        setTimeout(() => {
            setItems([...items, ...nextBatch]);
        }, 1500);
    };

    const updateCategoryCounts = (ads: any[]) => {
        const counts = ads.reduce((acc, ad) => {
            const category = ad.category as Category;
            acc[category] = (acc[category] || 0) + 1;
            acc['all'] = (acc['all'] || 0) + 1;
            return acc;
        }, { ...initialCategoryCounts });

        setCategoryCounts(counts);
        localStorage.getItem('refresh_token');
    };

    const fetchCategories = async () => {
        try {
            const response = await getCategories();
            const fetchedCategories = response.data.categories;

            setCategories(['all', ...fetchedCategories]);
            console.log('Catégories récupérées:', fetchedCategories);
        } catch (error) {
            console.error('Erreur lors de la récupération des catégories:', error);
        }
    };

    const fetchAdDetails = async (id: string) => {
        try {
            const adDetails = await getAdById(id);
            console.log(`Détails de l'annonce:`, adDetails);

        } catch (error) {
            console.error(`Erreur lors de la récupération des détails de l'annonce avec l'id ${id}:`, error);
        }
    };

    return (
        <>        
  
  <FixedHeader
      categories={categories}
      selectedCategories={selectedCategories}
      isAllSelected={isAllSelected}
      subCategories={subCategories}
      handleCategoryChange={handleCategoryChange}
      handleCategoryHover={handleCategoryHover}
      handleSubCategoryChange={handleSubCategoryChange}
    />
      <div className="pt-[128px] p-4" >

            <h2 className="font-titleTest text-xl  sm:text-2xl ">
                {
                    items.length === 0 ? (
                        <>
                            <p className="font-titleTest text-3xl my-4">Fil des annonces : {items.length}</p>
                            <p className='font-bodyTest text-2xl mt-28 italic text-orange-500'>Nous n'avons pas trouvé d'évènement.</p>
                        </>
                    ) : (
                        <p data-cy="ads" className="font-titleTest text-xl my-4">Fil des annonces : {items.length}</p>
                    )
                }
            </h2>

            <div className="grid grid-cols-1 mb-2
            ">
                <Carousel>
                    {items.map((event) => (
                        <div key={event.id} className="relative h-64 md:h-96">
                            <Link to={`/ad/${event.id}`} className="link">
                                <div 
                                    className="absolute inset-0 flex items-end justify-end p-5 bg-cover bg-center bg-no-repeat"
                                    style={{ backgroundImage: `url(${event.adPicture})` }}
                                >                                
                                    <div className="p-3 bg-gray-500 bg-opacity-50 text-white">
                                        <b>{format(new Date(event.startTime), "'le' dd/MM/yyyy 'à' HH'h'mm", { locale: fr })}</b><br />
                                        <i>{event.title}</i><br />
                                        <b>{event.city}</b>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </Carousel>
            </div> 
            
            <InfiniteScroll
                dataLength={items.length}
                next={fetchMoreData}
                hasMore={hasMore}
                loader={
                    <div className="flex justify-center items-center w-full">
                        <ThreeDots
                        visible={true}
                        height="80"
                        width="80"
                        color="#1A56DB"
                        radius="8"
                        ariaLabel="three-dots-loading"
                        wrapperStyle={{}}
                        wrapperClass=""
                        />
                    </div>
                }
                endMessage={
                    <p className='text-center mt-6 text-blue-800'>
                        <b>Fin de la liste!</b>
                    </p>
                }
            >
                <div className='md:flex flex-wrap justify-between item-center gap-2 mt-8'>
                    {items.map((event) => (
                        <Card key={event.id} className='my-4 shadow-lg sm:w-80 sm:h-80 relative ...'>
                            {isSameDay(new Date(event.createdAt), new Date()) && (
                                <img src={Nouveau} alt="new" className="w-10 h-10 absolute top-0 right-0 ..." />
                            )}
                            <Link to={`/ad/${event.id}`} className="link text-blue-800 text-bodyTest">
                                <Link to={`/edit-ad/${event.id}`} className="link text-red-800 text-bodyTest">
                                    <CiEdit />
                                </Link>
                                <div className='flex flex-col'>
                                    <b>
                                        {event.title}
                                    </b>
                                    <i className='tracking-wider'>{event.start}</i>
                                    <i className='flex justify-between items-center'>
                                        {event.city} <span className='text-blue-700 font-bold'> Nbp {event.attendees}</span>
                                    </i>
                                    <img src={event.adPicture} alt="Ad Image" className="w-96 h-40 md:w-80 mt-2" />
                                    <i className="flex justify-end absolute bottom-0">{format(new Date(event.startTime), "'le' dd/MM/yyyy 'à' HH'h'mm", { locale: fr })}</i>
                                </div>
                            </Link>
                        </Card>
                    ))}
                </div>
            </InfiniteScroll>
            {/* <MapButton /> */}
            </div>
        </>
    );
}